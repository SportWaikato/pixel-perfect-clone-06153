import { useId } from "react";

interface RoughTextProps {
  children: string;
  /** approximate rendered height in px (font-size) */
  size?: number;
  color?: string;
  className?: string;
  /** roughness of the torn edge; 0 = clean, ~2.5 = gritty */
  grit?: number;
}

/**
 * Renders a fixed brand phrase ("GO FOR IT!", "SPORTS DAY", …) in the free Anton
 * condensed face with a torn/distressed edge, approximating the ZUUME Rough look
 * used in the print brand WITHOUT embedding the paid font. The rough edge is an
 * SVG turbulence displacement filter, so it stays crisp and scalable.
 *
 * Use ONLY for short, fixed hero phrases — dynamic headings use `font-display`.
 */
const RoughText = ({
  children,
  size = 64,
  color = "#ffffff",
  className,
  grit = 1.4,
}: RoughTextProps) => {
  const id = useId().replace(/:/g, "");
  const text = children.toUpperCase();
  // Rough SVG height a touch taller than the cap height to fit the displacement.
  const h = size * 1.28;
  return (
    <svg
      className={className}
      height={h}
      viewBox={`0 0 1000 ${h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={children}
      style={{ maxWidth: "100%", overflow: "visible" }}
    >
      <defs>
        <filter id={`rough-${id}`} x="-8%" y="-25%" width="116%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.14"
            numOctaves="2"
            seed="7"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={grit * 3}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <text
        x="500"
        y={h / 2}
        dominantBaseline="central"
        textAnchor="middle"
        fill={color}
        filter={`url(#rough-${id})`}
        style={{
          fontFamily: '"Anton", "Antonio Variable", sans-serif',
          fontSize: size,
          letterSpacing: "0.01em",
        }}
        // shrink to fit the viewBox width so long phrases never clip
        textLength="960"
        lengthAdjust="spacingAndGlyphs"
      >
        {text}
      </text>
    </svg>
  );
};

export default RoughText;
