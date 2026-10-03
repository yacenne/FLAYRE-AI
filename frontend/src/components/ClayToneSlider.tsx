"use client";

import React, { useRef } from "react";

export interface ToneOption {
  id: string;
  label: string;
  emoji?: string;
  badge?: string;
}

interface ClayToneSliderProps {
  tones?: ToneOption[];
  activeTone: string;
  onChange: (toneId: string) => void;
  className?: string;
  compact?: boolean;
}

const DEFAULT_TONES: ToneOption[] = [
  { id: "casual", label: "Casual", emoji: "😊" },
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "creative", label: "Creative", emoji: "✨" },
  { id: "friendly", label: "Friendly", emoji: "💛" },
];

export function ClayToneSlider({
  tones = DEFAULT_TONES,
  activeTone,
  onChange,
  className = "",
  compact = false,
}: ClayToneSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const activeIndex = Math.max(
    0,
    tones.findIndex((t) => t.id === activeTone)
  );

  const percentage = tones.length > 1 ? (activeIndex / (tones.length - 1)) * 100 : 0;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const closestIndex = Math.round(ratio * (tones.length - 1));
    onChange(tones[closestIndex].id);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`${compact ? "text-[11px]" : "text-xs"} font-black uppercase tracking-wider text-[#4A3D33] dark:text-[#C5B8A8]`}>
          Response Tone
        </span>
        <span className={`${compact ? "text-[11px]" : "text-xs"} font-black text-[#D36A48] dark:text-[#E2724E] flex items-center gap-1`}>
          <span>{tones[activeIndex]?.emoji}</span>
          <span>{tones[activeIndex]?.label}</span>
        </span>
      </div>

      {/* Physical Grooved Ceramic Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="ceramic-slider-track w-full flex items-center cursor-pointer group relative my-1"
      >
        {/* Fill Line */}
        <div
          className="absolute left-0 top-0 bottom-0 rounded-full bg-gradient-to-r from-[#DE896D] to-[#D36A48] opacity-70 transition-all duration-200"
          style={{ width: `${percentage}%` }}
        />

        {/* Notch Markers precisely aligned to steps */}
        {tones.map((t, idx) => {
          const notchPercent = tones.length > 1 ? (idx / (tones.length - 1)) * 100 : 0;
          const isSelected = idx === activeIndex;
          return (
            <div
              key={t.id}
              className={`w-2 h-2 rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-150 ${
                isSelected
                  ? "bg-[#FFFFFF] scale-125 shadow-xs"
                  : "bg-[#9A8B7D] dark:bg-[#5A4B3D] opacity-60"
              }`}
              style={{ left: `${notchPercent}%` }}
            />
          );
        })}

        {/* 3D Tactile Ceramic Spherical Bead Knob */}
        <div
          className="ceramic-slider-knob absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-200 ease-out flex items-center justify-center"
          style={{ left: `${percentage}%` }}
        >
          {/* Specular Glaze Highlight */}
          <div className="w-1.5 h-1.5 rounded-full bg-white/80 absolute top-1 left-1.5 pointer-events-none" />
        </div>
      </div>

      {/* Notch Labels */}
      <div className={`flex justify-between items-center px-0.5 ${compact ? "text-[9.5px] sm:text-[10px]" : "text-[11px]"} font-bold text-[#6B5E52] dark:text-[#9A8D7F]`}>
        {tones.map((t) => {
          const isSelected = t.id === activeTone;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`transition-colors text-center hover:text-[#D36A48] ${
                isSelected
                  ? "text-[#D36A48] dark:text-[#E2724E] font-black scale-105"
                  : ""
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
