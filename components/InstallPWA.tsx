import { useEffect, useState } from "react";
import { Download } from "lucide-react";

let deferredPrompt: any = null;

export function InstallPWA() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      console.log("✅ PWA installed");
    }

    deferredPrompt = null;
    setCanInstall(false);
  };

  if (!canInstall) return null;

  return (
    <button
      onClick={installApp}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest"
    >
      <Download size={16} />
      Install App
    </button>
  );
}
