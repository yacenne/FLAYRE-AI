"use client";

import React from "react";

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
  const activeIndex = Math.max(
    0,
    tones.findIndex((t) => t.id === activeTone)
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`${compact ? "text-[11px]" : "text-xs"} font-bold uppercase tracking-wider text-slate-500`}>
          AI Tone Calibration
        </span>
        <span className={`${compact ? "text-[11px]" : "text-xs"} font-bold text-[#FF5238] flex items-center gap-1.5`}>
          <span>{tones[activeIndex]?.emoji}</span>
          <span>{tones[activeIndex]?.label}</span>
        </span>
      </div>

      {/* Modern Segmented Pill Bar */}
      <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid grid-flow-col auto-cols-fr gap-1">
        {tones.map((t) => {
          const isSelected = t.id === activeTone;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
                isSelected
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>{t.emoji}</span>
              <span className={compact ? "hidden sm:inline" : ""}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
