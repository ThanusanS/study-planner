import React, { useState, useEffect } from "react";
import { X, Download, Wifi, Bell, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Dismissed recently (wait 7 days)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
    setShowBanner(false);
    setInstalling(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Backdrop blur on mobile */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden"
        onClick={handleDismiss}
      />

      {/* Banner */}
      <div className="fixed bottom-20 left-3 right-3 md:bottom-8 md:left-auto md:right-6 md:w-[420px] z-50 animate-in slide-in-from-bottom-6 fade-in duration-500">
        {/* Glow effect */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-70 blur-[2px]" />

        {/* Card */}
        <div className="relative bg-zinc-950/95 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5">

          {/* Top shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

          <div className="p-4">
            <div className="flex items-center gap-4">

              {/* App icon */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 8.5 12 5l7.5 3.5-7.5 3.5-7.5-3.5Z" />
                    <path d="M7 11.5v3.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-3.5" />
                    <path d="M19.5 9.5v4" />
                  </svg>
                </div>
                {/* Ping dot */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-zinc-950 animate-pulse" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-black text-base leading-tight">
                    Install Study Planner
                  </h3>
                </div>

                {/* Features row */}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {[
                    { icon: Wifi, label: "Offline" },
                    { icon: Bell, label: "Notifications" },
                    { icon: Smartphone, label: "Home Screen" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1 text-zinc-400">
                      <Icon className="w-3 h-3 text-indigo-400" />
                      <span className="text-[10px] font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dismiss */}
              <button
                onClick={handleDismiss}
                className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 shrink-0 self-start"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 my-3" />

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 relative group overflow-hidden h-10 rounded-xl font-bold text-sm text-white transition-all duration-300 active:scale-95"
              >
                {/* Button gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-300 group-hover:from-indigo-500 group-hover:via-purple-500 group-hover:to-pink-500" />
                {/* Shimmer */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="relative flex items-center justify-center gap-2">
                  {installing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {installing ? "Installing..." : "Install App — It's Free"}
                </div>
              </button>

              <button
                onClick={handleDismiss}
                className="h-10 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/5 font-medium text-sm transition-all duration-200"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
