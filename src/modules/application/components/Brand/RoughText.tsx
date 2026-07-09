import { useId } from "react";

interface RoughTextProps {
  children: string;
  size?: number;
  color?: string;
  className?: string;
  grit?: number;
}

/**
 * Bold display text for hero phrases ("GO FOR IT!", "EVERY MOVE COUNTS").
 * Uses Bricolage Grotesque (self-hosted) — no proprietary fonts needed.
 * The SVG turbulence filter adds a subtle grit/print texture without distortion.
 */
const RoughText = ({
  children,
  size = 64,
  color = "#ffffff",
  className,
  grit = 1.2,
}: RoughTextProps) => {
  const id = useId().replace(/:/g, "");
  const text = children.toUpperCase();
  const h = size * 1.35;
  const padX = size * 0.3;
  const charW = size * 0.62;
  const vbW = text.length * charW + padX * 2;

  return (
    <svg
      className={className}
      height={h}
      viewBox={`0 0 ${vbW} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={children}
      style={{ maxWidth: "100%", overflow: "visible" }}
    >
      <defs>
        <filter id={`rough-${id}`} x="-4%" y="-15%" width="108%" height="130%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.025 0.18"
            numOctaves="1"
            seed="3"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={grit * 2}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <text
        x={vbW / 2}
        y={h / 2}
        dominantBaseline="central"
        textAnchor="middle"
        fill={color}
        filter={`url(#rough-${id})`}
        style={{
          fontFamily: "'Bricolage Grotesque Variable', 'Arial Black', sans-serif",
          fontSize: size,
          fontWeight: 800,
          letterSpacing: "-0.01em",
        }}
      >
        {text}
      </text>
    </svg>
  );
};

export default RoughText;
