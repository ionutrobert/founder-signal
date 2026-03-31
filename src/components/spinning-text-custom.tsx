"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

type SpinningTextProps = {
  text: string;
  radius?: number;
  textClassName?: string;
  speed?: number;
  direction?: "normal" | "reverse";
  className?: string;
};

export function SpinningText({
  text,
  radius = 37,
  textClassName = "text-[8px]",
  speed = 10,
  direction = "normal",
  className,
}: SpinningTextProps) {
  // Use React's useId for stable unique ID
  const pathId = `circlePath-${useId()}`;

  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label={text}>
        <title>{text}</title>
        <g
          className="origin-center animate-spin"
          style={{
            animationDuration: `${speed}s`,
            animationDirection: direction,
          }}
        >
          <path
            id={pathId}
            d={`
              M 50,50
              m -${radius},0
              a ${radius},${radius} 0 1,1 ${radius * 2},0
              a ${radius},${radius} 0 1,1 -${radius * 2},0
            `}
            fill="none"
          />
          <text
            className={cn(
              `uppercase font-normal fill-muted-foreground tracking-widest`,
              textClassName,
            )}
          >
            <textPath xlinkHref={`#${pathId}`} startOffset="0%">
              {text}
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
}

export default SpinningText;
