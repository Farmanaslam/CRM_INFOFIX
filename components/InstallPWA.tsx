
import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    
    const installedHandler = () => {
        setIsInstalled(true);
        setSupportsPWA(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) return;
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        // console.log('User accepted the install prompt');
      }
      setPromptInstall(null);
      setSupportsPWA(false);
    });
  };

  if (!supportsPWA || isInstalled) return null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all active:scale-95 group animate-in slide-in-from-left-4 duration-500"
    >
      <div className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
        <Download size={14} />
      </div>
      <div className="text-left">
        <span className="block leading-none">Install App</span>
        <span className="text-[8px] opacity-80 normal-case font-medium">Add to Home Screen</span>
      </div>
    </button>
  );
};
