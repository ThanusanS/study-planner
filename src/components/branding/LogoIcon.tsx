import React from "react";

export interface LogoIconProps {
  className?: string;
  animated?: boolean;
  variant?: "gradient" | "solid-bg" | "monochrome-white" | "monochrome-dark";
}

export const LogoIcon: React.FC<LogoIconProps> = ({
  className = "w-8 h-8",
  animated = true,
  variant = "gradient",
}) => {
  const isSolidBg = variant === "solid-bg";

  // Gradient definitions (brighter pastel tones for high visibility on dark theme)
  const capGradId = `logo-cap-grad-${variant}`;
  const sparkleGradId = `logo-sparkle-grad-${variant}`;

  return (
    <svg
      className={`${className} transition-transform duration-300 hover:scale-105`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Study Planner Logo"
    >
      <defs>
        {/* Bright, high-contrast gradient for dark backgrounds (yellow-green for solid-bg/favicon) */}
        <linearGradient id={capGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isSolidBg ? (
            <>
              <stop offset="0%" stopColor="#22c55e" /> {/* Vivid Green */}
              <stop offset="100%" stopColor="#facc15" /> {/* Vivid Yellow */}
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#a78bfa" /> {/* Bright Violet-400 */}
              <stop offset="50%" stopColor="#6366f1" /> {/* Indigo-500 */}
              <stop offset="100%" stopColor="#22d3ee" /> {/* Bright Cyan-400 */}
            </>
          )}
        </linearGradient>

        {/* Soft fill for transparent variant */}
        <linearGradient id="logo-cap-fill-soft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
        </linearGradient>

        {/* Sparkle fill gradient */}
        <linearGradient id={sparkleGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {/* Solid Background Squircle - Perfect for App Icons and Favicons */}
      {isSolidBg && (
        <rect
          x="2"
          y="2"
          width="28"
          height="28"
          rx="7.5"
          fill={`url(#${capGradId})`}
        />
      )}

      {/* Graduation Cap Diamond Top */}
      <path
        d="M 6,13 L 16,8.5 L 26,13 L 16,17.5 Z"
        fill={
          isSolidBg
            ? "rgba(255, 255, 255, 0.15)"
            : variant === "gradient"
            ? "url(#logo-cap-fill-soft)"
            : "transparent"
        }
        stroke={
          isSolidBg
            ? "#ffffff"
            : variant === "gradient"
            ? `url(#${capGradId})`
            : variant === "monochrome-white"
            ? "#ffffff"
            : "#0f172a"
        }
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Graduation Cap Skullcap Base */}
      <path
        d="M 10.5,15.5 V 18.5 C 10.5,20.5 12.8,21.5 16,21.5 C 19.2,21.5 21.5,20.5 21.5,18.5 V 15.5"
        stroke={
          isSolidBg
            ? "#ffffff"
            : variant === "gradient"
            ? `url(#${capGradId})`
            : variant === "monochrome-white"
            ? "#ffffff"
            : "#0f172a"
        }
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Tassel */}
      <path
        d="M 22,12.5 L 24,15 V 19 C 24,19.8 23.5,20.2 22.7,20.2"
        stroke={
          isSolidBg
            ? "#ffffff"
            : variant === "gradient"
            ? `url(#${capGradId})`
            : variant === "monochrome-white"
            ? "#ffffff"
            : "#0f172a"
        }
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isSolidBg ? "0.9" : "0.8"}
      />

      {/* AI Sparkle / Magic Star (Pulsing at the center-top of the cap) */}
      <path
        d="M 16,10.5 C 16,12.2 15.5,12.7 14,12.7 C 15.5,12.7 16,13.2 16,15 C 16,13.2 16.5,12.7 18,12.7 C 16.5,12.7 16,12.2 16,10.5 Z"
        fill={
          isSolidBg
            ? "#ffffff"
            : variant === "gradient"
            ? `url(#${sparkleGradId})`
            : variant === "monochrome-white"
            ? "#ffffff"
            : "#0f172a"
        }
      >
        {animated && (
          <animate
            attributeName="opacity"
            values="0.6;1;0.6"
            dur="2.5s"
            repeatCount="indefinite"
          />
        )}
      </path>
    </svg>
  );
};
