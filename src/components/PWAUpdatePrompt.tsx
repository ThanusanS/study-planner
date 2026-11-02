import React, { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "../app/components/ui/button";
import { useRegisterSW } from "virtual:pwa-register/react";

export const PWAUpdatePrompt: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check for updates every 60 minutes
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegSWUpdFound() {
      console.log("SW update found!");
    },
  });

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:top-4 md:left-auto md:right-4 md:w-80 z-[100] animate-in slide-in-from-top-4 duration-500">
      <div className="bg-emerald-600 rounded-xl p-3 shadow-xl shadow-emerald-500/20 border border-emerald-400/20">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-white shrink-0 animate-spin" />
          <div className="flex-1">
            <p className="text-white font-bold text-xs">Update available!</p>
            <p className="text-emerald-100 text-[10px] mt-0.5">
              A new version of Study Planner is ready.
            </p>
          </div>
          <Button
            onClick={() => updateServiceWorker(true)}
            size="sm"
            className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold text-[11px] h-7 px-3 rounded-lg shrink-0"
          >
            Update
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-emerald-200 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
