"use client";;
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/index";
import { MicIcon, SquareIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function writeString(view, offset, string) {
  for (let index = 0; index < string.length; index += 1) {
    view.setUint8(offset + index, string.charCodeAt(index));
  }
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1, offset += 2) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

function resampleAudio(samples, sourceSampleRate, targetSampleRate) {
  if (sourceSampleRate === targetSampleRate) {
    return samples;
  }

  const targetLength = Math.max(
    1,
    Math.round(samples.length * (targetSampleRate / sourceSampleRate))
  );
  const resampled = new Float32Array(targetLength);
  const ratio = sourceSampleRate / targetSampleRate;

  for (let index = 0; index < targetLength; index += 1) {
    const sourceIndex = index * ratio;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(lowerIndex + 1, samples.length - 1);
    const fraction = sourceIndex - lowerIndex;
    const lowerSample = samples[lowerIndex] || 0;
    const upperSample = samples[upperIndex] || 0;
    resampled[index] = lowerSample + (upperSample - lowerSample) * fraction;
  }

  return resampled;
}

async function convertRecordedAudioToWav(recordedBlob) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    throw new Error("audio_decode_unsupported");
  }

  const audioContext = new AudioContext();
  try {
    const audioBuffer = await audioContext.decodeAudioData(
      await recordedBlob.arrayBuffer()
    );
    const channel = audioBuffer.getChannelData(0);
    const samples = new Float32Array(channel.length);
    samples.set(channel);
    const resampledSamples = resampleAudio(samples, audioBuffer.sampleRate, 16000);
    const audioPeak = resampledSamples.reduce(
      (peak, sample) => Math.max(peak, Math.abs(sample)),
      0
    );
    const audioRms = Math.sqrt(
      resampledSamples.reduce((sum, sample) => sum + sample * sample, 0) /
        Math.max(1, resampledSamples.length)
    );
    const audioBlob = encodeWav(resampledSamples, 16000);

    console.warn("[speech-input] decoded recording", {
      sourceSampleRate: audioBuffer.sampleRate,
      targetSampleRate: 16000,
      samples: resampledSamples.length,
      audioPeak,
      audioRms,
      bytes: audioBlob.size,
    });

    return audioBlob;
  } finally {
    await audioContext.close();
  }
}

const detectSpeechInputMode = ({ preferAudioRecorded = false } = {}) => {
  if (typeof window === "undefined") {
    return "none";
  }

  if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
    return "speech-recognition";
  }

  if (
    preferAudioRecorded &&
    "MediaRecorder" in window &&
    "mediaDevices" in navigator
  ) {
    return "media-recorder";
  }

  if ("MediaRecorder" in window && "mediaDevices" in navigator) {
    return "media-recorder";
  }

  return "none";
};

export const SpeechInput = ({
  className,
  disabled,
  onTranscriptionChange,
  onAudioRecorded,
  onTranscriptionError,
  lang = "en-US",
  recorderMimeType,
  ...props
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode] = useState(() =>
    detectSpeechInputMode({ preferAudioRecorded: Boolean(onAudioRecorded) })
  );
  const [isRecognitionReady, setIsRecognitionReady] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const wavRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const onTranscriptionChangeRef = useRef(onTranscriptionChange);
  const onTranscriptionErrorRef = useRef(onTranscriptionError);
  const onAudioRecordedRef =
    useRef(onAudioRecorded);
  const currentBrowserUnsupportedMessage = "当前浏览器不支持语音转文字";

  // Keep refs in sync
  onTranscriptionChangeRef.current = onTranscriptionChange;
  onTranscriptionErrorRef.current = onTranscriptionError;
  onAudioRecordedRef.current = onAudioRecorded;

  // Initialize Speech Recognition when mode is speech-recognition
  useEffect(() => {
    if (mode !== "speech-recognition") {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechRecognition = new SpeechRecognition();

    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.maxAlternatives = 1;
    speechRecognition.lang = lang;

    const handleStart = () => {
      setIsListening(true);
    };

    const handleEnd = () => {
      setIsListening(false);
    };

    const handleResult = (event) => {
      const speechEvent = event;
      let transcript = "";

      for (
        let i = speechEvent.resultIndex;
        i < speechEvent.results.length;
        i += 1
      ) {
        const result = speechEvent.results[i];
        transcript += result[0]?.transcript ?? "";
      }

      if (transcript) {
        onTranscriptionChangeRef.current?.(transcript);
      }
    };

    const handleError = () => {
      setIsListening(false);
    };

    speechRecognition.addEventListener("start", handleStart);
    speechRecognition.addEventListener("end", handleEnd);
    speechRecognition.addEventListener("result", handleResult);
    speechRecognition.addEventListener("error", handleError);

    recognitionRef.current = speechRecognition;
    setIsRecognitionReady(true);

    return () => {
      speechRecognition.removeEventListener("start", handleStart);
      speechRecognition.removeEventListener("end", handleEnd);
      speechRecognition.removeEventListener("result", handleResult);
      speechRecognition.removeEventListener("error", handleError);
      speechRecognition.stop();
      recognitionRef.current = null;
      setIsRecognitionReady(false);
    };
  }, [mode, lang]);

  // Cleanup MediaRecorder and stream on unmount
  useEffect(() => () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    wavRecorderRef.current?.stop();
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
    }
  }, []);

  const startWavRecorder = useCallback(async () => {
    if (!onAudioRecordedRef.current) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      await audioContext.resume();
      const sourceSampleRate = audioContext.sampleRate;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const chunks = [];

      processor.onaudioprocess = (event) => {
        chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      wavRecorderRef.current = {
        stop: async () => {
          processor.disconnect();
          source.disconnect();
          for (const track of stream.getTracks()) {
            track.stop();
          }
          streamRef.current = null;
          const sampleLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
          const samples = new Float32Array(sampleLength);
          let offset = 0;
          for (const chunk of chunks) {
            samples.set(chunk, offset);
            offset += chunk.length;
          }

          await audioContext.close();
          const resampledSamples = resampleAudio(samples, sourceSampleRate, 16000);
          const audioPeak = resampledSamples.reduce(
            (peak, sample) => Math.max(peak, Math.abs(sample)),
            0
          );
          const audioRms = Math.sqrt(
            resampledSamples.reduce((sum, sample) => sum + sample * sample, 0) /
              Math.max(1, resampledSamples.length)
          );
          const audioBlob = encodeWav(resampledSamples, 16000);
          console.warn("[speech-input] recorded", {
            sourceSampleRate,
            targetSampleRate: 16000,
            samples: resampledSamples.length,
            audioPeak,
            audioRms,
            bytes: audioBlob.size,
          });
          if (audioBlob.size > 0 && onAudioRecordedRef.current) {
            setIsProcessing(true);
            try {
              const transcript = await onAudioRecordedRef.current(audioBlob);
              console.warn("[speech-input] transcript", {
                textLength: transcript?.length || 0,
              });
              if (transcript) {
                onTranscriptionChangeRef.current?.(transcript);
              }
            } catch (error) {
              console.error("[speech-input] transcription failed", error);
              onTranscriptionErrorRef.current?.(error);
            } finally {
              setIsProcessing(false);
              wavRecorderRef.current = null;
            }
          }
        },
      };

      setIsListening(true);
    } catch (error) {
      console.error("[speech-input] wav recording failed", error);
      setIsListening(false);
    }
  }, []);

  // Start MediaRecorder recording
  const startMediaRecorder = useCallback(async () => {
    if (!onAudioRecordedRef.current) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType =
        recorderMimeType && recorderMimeType !== "audio/wav" &&
        MediaRecorder.isTypeSupported(recorderMimeType)
          ? recorderMimeType
          : [
              "audio/webm;codecs=opus",
              "audio/ogg;codecs=opus",
              "audio/mp4",
            ].find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      audioChunksRef.current = [];

      const handleDataAvailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      const handleStop = async () => {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        streamRef.current = null;

        const recordedBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || mimeType || "audio/webm",
        });
        const audioBlob =
          recorderMimeType === "audio/wav"
            ? await convertRecordedAudioToWav(recordedBlob)
            : recordedBlob;

        if (audioBlob.size > 0 && onAudioRecordedRef.current) {
          setIsProcessing(true);
          try {
            const transcript = await onAudioRecordedRef.current(audioBlob);
            if (transcript) {
              onTranscriptionChangeRef.current?.(transcript);
            }
          } catch (error) {
            console.error("[speech-input] transcription failed", error);
            onTranscriptionErrorRef.current?.(error);
          } finally {
            setIsProcessing(false);
          }
        }
      };

      const handleError = () => {
        setIsListening(false);
        for (const track of stream.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      };

      mediaRecorder.addEventListener("dataavailable", handleDataAvailable);
      mediaRecorder.addEventListener("stop", handleStop);
      mediaRecorder.addEventListener("error", handleError);

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error("[speech-input] media recording failed", error);
      setIsListening(false);
    }
  }, [recorderMimeType, startWavRecorder]);

  // Stop MediaRecorder recording
  const stopMediaRecorder = useCallback(() => {
    if (wavRecorderRef.current) {
      wavRecorderRef.current.stop();
      setIsListening(false);
      return;
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (mode === "speech-recognition" && recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    } else if (mode === "media-recorder") {
      if (isListening) {
        stopMediaRecorder();
      } else {
        startMediaRecorder();
      }
    }
  }, [mode, isListening, startMediaRecorder, stopMediaRecorder]);

  const isBrowserUnsupported =
    mode === "none" || (mode === "media-recorder" && !onAudioRecorded);
  const statusMessage = isBrowserUnsupported
    ? currentBrowserUnsupportedMessage
    : mode === "speech-recognition" && !isRecognitionReady
      ? "语音输入正在初始化"
      : undefined;

  // Determine if button should be disabled
  const isDisabled =
    disabled ||
    isBrowserUnsupported ||
    (mode === "speech-recognition" && !isRecognitionReady) ||
    isProcessing;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      title={statusMessage}
    >
      {/* Animated pulse rings */}
      {isListening &&
        [0, 1, 2].map((index) => (
          <div
            className="absolute inset-0 animate-ping rounded-full border-2 border-red-400/30"
            key={index}
            style={{
              animationDelay: `${index * 0.3}s`,
              animationDuration: "2s",
            }} />
        ))}
      {/* Main record button */}
      <Button
        className={cn("relative z-10 rounded-full transition-all duration-300", isListening
          ? "bg-destructive text-white hover:bg-destructive/80 hover:text-white"
          : "bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground", className)}
        data-recording={isListening}
        data-speech-mode={mode}
        data-unsupported={isBrowserUnsupported}
        onClick={toggleListening}
        {...props}
        aria-disabled={isDisabled}
        disabled={isDisabled}>
        {isProcessing && <Spinner />}
        {!isProcessing && isListening && <SquareIcon className="size-4" />}
        {!(isProcessing || isListening) && <MicIcon className="size-4" />}
      </Button>
    </div>
  );
};
