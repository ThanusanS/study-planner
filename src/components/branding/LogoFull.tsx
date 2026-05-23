import React from "react";
import { LogoIcon } from "./LogoIcon";

export interface LogoFullProps {
  className?: string;
  iconSize?: string;
  animated?: boolean;
  showAI?: boolean;
  variant?: "default" | "monochrome-white" | "monochrome-dark";
}

export const LogoFull: React.FC<LogoFullProps> = ({
  className = "flex items-center gap-2.5",
  iconSize = "w-9 h-9",
  animated = true,
  showAI = true,
  variant = "default",
}) => {
  // Define text colors and layouts
  const studyColor =
    variant === "default"
      ? "text-white"
      : variant === "monochrome-white"
      ? "text-white"
      : "text-slate-900";

  return (
    <div className={`${className} group cursor-pointer`}>
      <LogoIcon
        className={iconSize}
        animated={animated}
        variant={
          variant === "monochrome-white"
            ? "monochrome-white"
            : variant === "monochrome-dark"
            ? "monochrome-dark"
            : "gradient"
        }
      />
      <div className="flex items-center gap-1.5 select-none">
        <span
          className="font-bold text-lg tracking-tight lp-font-display flex items-baseline"
          style={{ letterSpacing: "-0.03em" }}
        >
          <span className={`${studyColor} transition-colors duration-200`}>Study</span>
          <span
            className={
              variant === "default"
                ? "bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent group-hover:brightness-110 transition-all duration-200"
                : studyColor
            }
          >
            Planner
          </span>
        </span>

        {showAI && (
          <span
            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md tracking-wider uppercase transition-colors duration-200 ${
              variant === "default"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20"
                : variant === "monochrome-white"
                ? "bg-white/10 text-white border border-white/20"
                : "bg-slate-900/10 text-slate-900 border border-slate-900/20"
            }`}
          >
            AI
          </span>
        )}
      </div>
    </div>
  );
};
