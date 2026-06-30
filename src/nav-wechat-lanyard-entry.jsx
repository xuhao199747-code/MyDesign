import { createRoot } from "react-dom/client";
import Lanyard from "./components/Lanyard/Lanyard.jsx";

import backPhoto from "../imag/photo1.webp?url";
import wechatCard from "../imag/wechat-qr-placeholder.svg?url";

export function mountNavWechatLanyard() {
  const mount = document.getElementById("navWechatLanyardMount");
  if (!mount || mount.dataset.reactMounted === "true") return;

  mount.dataset.reactMounted = "true";
  createRoot(mount).render(
    <Lanyard
      position={[0, 0, 25]}
      gravity={[0, -38, 0]}
      fov={19}
      frontImage={wechatCard}
      backImage={backPhoto}
      imageFit="contain"
      lanyardWidth={0.85}
      anchorSelector='[data-shell-node="wechat-trigger"]'
    />
  );
}
