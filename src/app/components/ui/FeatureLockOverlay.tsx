import React from "react";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "./button";

interface FeatureLockOverlayProps {
  planRequired: "pro" | "premium";
  featureName: string;
  activePlan: "free" | "pro" | "premium";
  onUpgradeClick: () => void;
  children: React.ReactNode;
}

export const FeatureLockOverlay: React.FC<FeatureLockOverlayProps> = ({
  planRequired,
  featureName,
  activePlan,
  onUpgradeClick,
  children,
}) => {
  const isLocked = React.useMemo(() => {
    if (planRequired === "premium" && activePlan !== "premium") return true;
    if (planRequired === "pro" && activePlan === "free") return true;
    return false;
  }, [planRequired, activePlan]);

  if (!isLocked) {
    return <>{children}</>;
  }

  const badgeText = planRequired === "pro" ? "⭐ Scholar Pro" : "👑 Elite Premium";
  const badgeColor = planRequired === "pro" 
    ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

  return (
    <div className="relative w-full h-full min-h-[300px]">
      {/* Blurred background content */}
      <div className="w-full h-full filter blur-[5px] opacity-40 pointer-events-none select-none">
        {children}
      </div>

      {/* Lock Overlay Shield */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="max-w-md w-full rounded-3xl border border-border/80 bg-card/65 backdrop-blur-xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/25 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Lock Hex Icon Wrapper */}
            <div className={`w-14 h-14 rounded-2xl ${planRequired === "pro" ? "bg-violet-500/15 text-violet-500" : "bg-amber-500/15 text-amber-500"} flex items-center justify-center mb-5 border border-white/10 shadow-lg shrink-0 animate-bounce`}>
              <Lock className="w-6 h-6" />
            </div>

            {/* Required Plan Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${badgeColor} mb-4`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Requires {badgeText}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-2">
              Unlock {featureName}
            </h3>
            
            <p className="text-muted-foreground text-xs sm:text-sm mb-6 leading-relaxed">
              Unlock immediate access to this feature plus 
              {planRequired === "pro" ? " 500 AI credits" : " 3,000 AI credits"} and premium student learning assistance.
            </p>

            {/* Custom Perks Bulletpoints */}
            <div className="w-full bg-background/55 dark:bg-zinc-950/20 border border-border/50 rounded-2xl p-4 mb-6 text-left space-y-2">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block opacity-75">What you get:</span>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{planRequired === "pro" ? "AI Study Planner & full notes generator" : "Advanced AI Tutor with deep answers"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{planRequired === "pro" ? "Advanced analytics & export PDF reports" : "Personalized roadmaps & adaptive plans"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{planRequired === "pro" ? "500 monthly AI credits" : "3,000 monthly credits + premium priority support"}</span>
                </li>
              </ul>
            </div>

            {/* CTAs */}
            <Button
              onClick={onUpgradeClick}
              className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm shadow-md transition-all ${
                planRequired === "pro" 
                  ? "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/10" 
                  : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10"
              }`}
            >
              <span>Upgrade to {planRequired === "pro" ? "Scholar Pro" : "Elite Premium"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <button
              onClick={onUpgradeClick}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              View all plan benefits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
