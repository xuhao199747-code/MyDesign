/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";

import cardGLB from "./card.glb?url";
import lanyardTexture from "./lanyard.png?url";
import "./Lanyard.css";

extend({ MeshLineGeometry, MeshLineMaterial });

useGLTF.preload(cardGLB);
useTexture.preload(lanyardTexture);

const BLANK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

export default function Lanyard({
  position = [0, 0, 18],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = "cover",
  lanyardImage = null,
  lanyardWidth = 1,
  anchorSelector = null,
}) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) =>
          gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)
        }
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            anchorSelector={anchorSelector}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}

function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = "cover",
  lanyardImage = null,
  lanyardWidth = 1,
  anchorSelector = null,
}) {
  const band = useRef(null);
  const fixed = useRef(null);
  const j1 = useRef(null);
  const j2 = useRef(null);
  const j3 = useRef(null);
  const card = useRef(null);
  const { camera, size } = useThree();
  const [anchorPosition, setAnchorPosition] = useState([0, 4, 0]);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4,
  };

  const { nodes, materials } = useGLTF(cardGLB);
  const texture = useTexture(lanyardImage || lanyardTexture);
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  const cardMap = useMemo(() => {
    const baseMap = materials.base.map;
    if (!frontImage && !backImage) return baseMap;

    const baseImage = baseMap.image;
    const canvas = document.createElement("canvas");
    const width = baseImage.width;
    const height = baseImage.height;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return baseMap;

    context.drawImage(baseImage, 0, 0, width, height);

    const drawFitted = (image, rect) => {
      const rx = rect.x * width;
      const ry = rect.y * height;
      const rw = rect.w * width;
      const rh = rect.h * height;
      const pick = imageFit === "contain" ? Math.min : Math.max;
      const scale = pick(rw / image.width, rh / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const dx = rx + (rw - drawWidth) / 2;
      const dy = ry + (rh - drawHeight) / 2;

      context.save();
      context.beginPath();
      context.rect(rx, ry, rw, rh);
      context.clip();
      context.drawImage(image, dx, dy, drawWidth, drawHeight);
      context.restore();
    };

    if (frontImage && frontTex.image) drawFitted(frontTex.image, FRONT_UV_RECT);
    if (backImage && backTex.image) drawFitted(backTex.image, BACK_UV_RECT);

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [backImage, backTex, frontImage, frontTex, imageFit, materials.base.map]);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );
  const [dragged, setDragged] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dragStartPointRef = useRef(null);
  const hasMovedDuringDragRef = useRef(false);

  const placeBodies = (positions) => {
    positions.forEach(([ref, nextPosition]) => {
      if (!ref.current) return;
      ref.current.setTranslation(
        { x: nextPosition[0], y: nextPosition[1], z: nextPosition[2] },
        true
      );
      ref.current.setLinvel?.({ x: 0, y: 0, z: 0 }, true);
      ref.current.setAngvel?.({ x: 0, y: 0, z: 0 }, true);
      ref.current.wakeUp?.();
      if (ref.current.lerped) {
        ref.current.lerped.set(nextPosition[0], nextPosition[1], nextPosition[2]);
      }
    });
  };

  useEffect(() => {
    if (!anchorSelector) {
      setAnchorPosition([0, 4, 0]);
      return undefined;
    }

    const syncAnchorPosition = () => {
      const anchor = document.querySelector(anchorSelector);
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const anchorX = rect.left + rect.width / 2;
      const anchorY = rect.bottom;
      const cameraZ = Math.abs(camera.position.z);
      const viewportHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * cameraZ;
      const viewportWidth = viewportHeight * (size.width / size.height);
      const worldX = (anchorX / size.width - 0.5) * viewportWidth;
      const worldY = -(anchorY / size.height - 0.5) * viewportHeight;

      setAnchorPosition([worldX, worldY, 0]);
    };

    syncAnchorPosition();
    const frameId = window.requestAnimationFrame(syncAnchorPosition);
    window.addEventListener("resize", syncAnchorPosition);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", syncAnchorPosition);
    };
  }, [anchorSelector, camera.fov, camera.position.z, size.height, size.width]);

  useEffect(() => {
    const [anchorX, anchorY, anchorZ] = anchorPosition;
    placeBodies([
      [fixed, [anchorX, anchorY, anchorZ]],
      [j1, [anchorX + 0.5, anchorY, anchorZ]],
      [j2, [anchorX + 1, anchorY, anchorZ]],
      [j3, [anchorX + 1.5, anchorY, anchorZ]],
      [card, [anchorX + 2, anchorY, anchorZ]],
    ]);
  }, [anchorPosition]);

  useEffect(() => {
    const handleOpen = () => {
      const [anchorX, anchorY, anchorZ] = anchorPosition;
      placeBodies([
        [fixed, [anchorX, anchorY, anchorZ]],
        [j1, [anchorX + 0.08, anchorY + 0.15, anchorZ]],
        [j2, [anchorX + 0.16, anchorY + 0.3, anchorZ]],
        [j3, [anchorX + 0.24, anchorY + 0.45, anchorZ]],
        [card, [anchorX + 0.32, anchorY + 0.58, anchorZ]],
      ]);
      setDragged(false);
    };

    window.addEventListener("nav-wechat-card-open", handleOpen);
    return () => window.removeEventListener("nav-wechat-card-open", handleOpen);
  }, [anchorPosition]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0],
  ]);

  useEffect(() => {
    if (!hovered) return undefined;

    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [dragged, hovered]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      if (
        dragStartPointRef.current &&
        vec.distanceTo(dragStartPointRef.current) > 0.08
      ) {
        hasMovedDuringDragRef.current = true;
      }
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (!fixed.current || !j1.current || !j2.current || !j3.current || !card.current) {
      return;
    }

    [j1, j2].forEach((ref) => {
      if (!ref.current.lerped) {
        ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
      }

      const clampedDistance = Math.max(
        0.1,
        Math.min(1, ref.current.lerped.distanceTo(ref.current.translation()))
      );

      ref.current.lerped.lerp(
        ref.current.translation(),
        delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
      );
    });

    curve.points[0].copy(j3.current.translation());
    curve.points[1].copy(j2.current.lerped);
    curve.points[2].copy(j1.current.lerped);
    curve.points[3].copy(fixed.current.translation());
    band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));

    ang.copy(card.current.angvel());
    rot.copy(card.current.rotation());
    card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
  });

  curve.curveType = "chordal";
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group>
        <RigidBody position={anchorPosition} ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody
          position={[anchorPosition[0] + 0.5, anchorPosition[1], anchorPosition[2]]}
          ref={j1}
          {...segmentProps}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[anchorPosition[0] + 1, anchorPosition[1], anchorPosition[2]]}
          ref={j2}
          {...segmentProps}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[anchorPosition[0] + 1.5, anchorPosition[1], anchorPosition[2]]}
          ref={j3}
          {...segmentProps}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[anchorPosition[0] + 2, anchorPosition[1], anchorPosition[2]]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerUp={(event) => {
              event.target.releasePointerCapture(event.pointerId);
              if (hasMovedDuringDragRef.current) {
                window.dispatchEvent(new CustomEvent("nav-wechat-card-dragged"));
              }
              dragStartPointRef.current = null;
              hasMovedDuringDragRef.current = false;
              setDragged(false);
            }}
            onPointerDown={(event) => {
              event.target.setPointerCapture(event.pointerId);
              dragStartPointRef.current = new THREE.Vector3().copy(event.point);
              hasMovedDuringDragRef.current = false;
              setDragged(
                new THREE.Vector3().copy(event.point).sub(vec.copy(card.current.translation()))
              );
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-4, 1]}
          lineWidth={lanyardWidth}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(cardGLB);
