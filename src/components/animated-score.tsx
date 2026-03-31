"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SpinningText } from "@/components/spinning-text-custom";

interface AnimatedScoreProps {
  value: number;
  targetValue?: number;
  isCalculating?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AnimatedScore({
  value,
  targetValue,
  isCalculating = false,
  size = "lg",
  className,
}: AnimatedScoreProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousValueRef = useRef(value);

  // Animate value changes
  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = value;
    const duration = 800; // ms

    if (startValue === endValue) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percent = Math.min(progress / duration, 1);
      
      // ease-out cubic
      const eased = 1 - Math.pow(1 - percent, 3);
      const current = startValue + (endValue - startValue) * eased;
      
      setDisplayValue(Math.round(current));

      if (percent < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValueRef.current = endValue;
        startTimeRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      previousValueRef.current = endValue;
    };
  }, [value]);

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-40 h-40",
  };

  const textSizes = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  const getScoreColor = (score: number) => {
    if (score === 0 && isCalculating) return "text-slate-400";
    if (score < 50) return "text-red-500";
    if (score < 80) return "text-amber-500";
    return "text-emerald-500";
  };

  const getScoreRingColor = (score: number) => {
    if (score === 0 && isCalculating) return "stroke-slate-200";
    if (score < 50) return "stroke-red-500";
    if (score < 80) return "stroke-amber-500";
    return "stroke-emerald-500";
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = isCalculating 
    ? circumference 
    : circumference - (displayValue / 100) * circumference;

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Spinning text around the outside */}
      <div className="absolute -inset-4">
        <SpinningText
          text={isCalculating ? "ANALYZING • PROCESSING • CALCULATING •" : "VALIDATED • SCORED • READY •"}
          radius={25}
          textClassName="text-[3px] fill-slate-400"
          speed={isCalculating ? 8 : 15}
          direction="normal"
          className="w-full h-full"
        />
      </div>

      {/* Score circle */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full -rotate-90"
        role="img"
        aria-label={`Validation Score: ${displayValue}/100`}
      >
        <title>Validation Score: {displayValue}/100</title>
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgb(226, 232, 240)"
          strokeWidth="6"
        />
        
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          className={cn(
            "transition-all duration-500 ease-out",
            getScoreRingColor(displayValue)
          )}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>

      {/* Center score display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-bold tabular-nums transition-colors duration-300",
            textSizes[size],
            getScoreColor(displayValue)
          )}
        >
          {isCalculating && displayValue === 0 ? "—" : displayValue}
        </span>
        <span className="text-xs text-slate-400 font-medium">/100</span>
      </div>

      {/* Target indicator (if provided) */}
      {targetValue && targetValue > displayValue && (
        <div className="absolute -top-2 -right-2">
          <span className="text-[10px] text-slate-400 font-medium bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-slate-100">
            →{targetValue}
          </span>
        </div>
      )}
    </div>
  );
}

export default AnimatedScore;
