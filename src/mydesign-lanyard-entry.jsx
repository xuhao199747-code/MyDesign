import { createRoot } from "react-dom/client";
import Lanyard from "./components/Lanyard/Lanyard.jsx";

export function mountMyDesignLanyard() {
  const mount = document.getElementById("myDesignLanyardRoot");
  if (!mount || mount.dataset.reactMounted === "true") return;

  mount.dataset.reactMounted = "true";
  createRoot(mount).render(
    <Lanyard position={[0, 0, 30]} gravity={[0, -40, 0]} lanyardWidth={1} />
  );
}
