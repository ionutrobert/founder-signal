"use client";

import { useEffect, useState, useRef, useId } from "react";
import { motion, useSpring, useTransform, MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpinningTextProps {
  value: number;
  size?: number;
  duration?: number;
  className?: string;
}

export function SpinningText({
  value,
  size = 48,
  duration = 2000,
  className,
}: SpinningTextProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  const springConfig = {
    stiffness: 50,
    damping: 20,
    duration: duration / 1000,
  };

  const spring = useSpring(0, springConfig);

  const getColorClass = (val: number) => {
    if (val < 50) return "text-red-500";
    if (val < 80) return "text-amber-500";
    return "text-emerald-500";
  };

  useEffect(() => {
    if (!hasAnimated.current) {
      spring.set(value);
      hasAnimated.current = true;
    }
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return () => unsubscribe();
  }, [spring]);

  const colorClass = getColorClass(value);

  return (
    <div
      className={cn(
        "inline-flex items-baseline font-bold tabular-nums",
        colorClass,
        className
      )}
      style={{ fontSize: size }}
    >
      <motion.span
        className="relative overflow-hidden"
        style={{ height: size, lineHeight: `${size}px` }}
      >
        <DigitColumn value={displayValue} size={size} />
      </motion.span>
      <span
        className="ml-1 text-slate-400 font-medium"
        style={{ fontSize: size * 0.5 }}
      >
        /100
      </span>
    </div>
  );
}

// Individual digit column for slot machine effect
function DigitColumn({
  value,
  size,
}: {
  value: number;
  size: number;
}) {
  const digits = value.toString().split("");
  const animationId = useId();

  return (
    <div className="flex">
      {digits.map((digit, index) => {
        const digitKey = `${animationId}-col-${digit}-${index}`;
        return (
          <div
            key={digitKey}
            className="relative overflow-hidden"
            style={{
              width: size * 0.6,
              height: size,
            }}
          >
            <motion.div
              className="absolute flex flex-col"
              initial={{ y: "-100%" }}
              animate={{ y: `-${parseInt(digit) * 10}%` }}
              transition={{
                type: "spring",
                stiffness: 60,
                damping: 15,
                delay: index * 0.05,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <div
                  key={`${animationId}-num-${num}`}
                  style={{
                    height: size,
                    lineHeight: `${size}px`,
                  }}
                >
                  {num}
                </div>
              ))}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// Simpler version without slot machine effect
export function SpinningNumber({
  value,
  size = 48,
  duration = 2000,
  className,
}: SpinningTextProps) {
  const [displayValue, setDisplayValue] = useState(0);

  const springConfig = {
    stiffness: 50,
    damping: 20,
  };

  const spring = useSpring(0, springConfig);

  const getColorClass = (val: number) => {
    if (val < 50) return "text-red-500";
    if (val < 80) return "text-amber-500";
    return "text-emerald-500";
  };

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return () => unsubscribe();
  }, [spring]);

  return (
    <div
      className={cn(
        "inline-flex items-baseline font-bold tabular-nums",
        getColorClass(value),
        className
      )}
      style={{ fontSize: size }}
    >
      {displayValue}
      <span
        className="ml-1 text-slate-400 font-medium"
        style={{ fontSize: size * 0.5 }}
      >
        /100
      </span>
    </div>
  );
}
