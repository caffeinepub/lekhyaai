/**
 * Indian Economic Mandala Decoration
 *
 * Classic Indian mandala design incorporating economic motifs:
 * - Rupee (₹) symbol at the centre
 * - Coin circles in the ring
 * - Lotus petals (8-fold symmetry) — classic Indian pattern
 * - Knotwork border with diamond accents
 *
 * The colour is driven by CSS `--primary` via currentColor so it
 * automatically reacts to any theme change in ThemeContext.
 */

import { cn } from "@/lib/utils";

interface MandalaDecorProps {
  /** Size in pixels. Default 120 */
  size?: number;
  /** 0–1 opacity. Default 0.18 (subtle) */
  opacity?: number;
  className?: string;
  /** Whether to spin slowly. Default false */
  spin?: boolean;
  /** Extra inline style */
  style?: React.CSSProperties;
}

export default function MandalaDecor({
  size = 120,
  opacity = 0.18,
  className,
  spin = false,
  style,
}: MandalaDecorProps) {
  const r = size / 2; // radius / centre

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(
        "pointer-events-none select-none",
        spin && "animate-spin-slow",
        className,
      )}
      style={{
        opacity,
        color: "currentColor",
        ...style,
      }}
    >
      {/* ── Outermost knotwork ring ────────────────────────── */}
      <circle
        cx={r}
        cy={r}
        r={r * 0.96}
        fill="none"
        stroke="currentColor"
        strokeWidth={size * 0.012}
        strokeDasharray={`${size * 0.04} ${size * 0.025}`}
      />

      {/* ── Diamond border dots (16 positions) ───────────── */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
        const x = r + r * 0.9 * Math.cos(angle);
        const y = r + r * 0.9 * Math.sin(angle);
        return (
          <polygon
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative element
            key={`diamond-${i}`}
            points={`
              ${x},${y - size * 0.018}
              ${x + size * 0.018},${y}
              ${x},${y + size * 0.018}
              ${x - size * 0.018},${y}
            `}
            fill="currentColor"
          />
        );
      })}

      {/* ── Coin-circle ring (8 coins) ──────────────────── */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
        const cx = r + r * 0.72 * Math.cos(angle);
        const cy = r + r * 0.72 * Math.sin(angle);
        const coinR = size * 0.065;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative SVG element
          <g key={`coin-${i}`}>
            {/* Outer ring */}
            <circle
              cx={cx}
              cy={cy}
              r={coinR}
              fill="none"
              stroke="currentColor"
              strokeWidth={size * 0.014}
            />
            {/* Inner fill disc */}
            <circle cx={cx} cy={cy} r={coinR * 0.45} fill="currentColor" />
          </g>
        );
      })}

      {/* ── Lotus petals (8 outer, 8 inner) ─────────────── */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
        const nextAngle = ((i + 0.5) / 8) * 2 * Math.PI - Math.PI / 2;

        // Outer petal tip
        const tipX = r + r * 0.56 * Math.cos(angle);
        const tipY = r + r * 0.56 * Math.sin(angle);

        // Base arc points
        const baseOffset = Math.PI / 16;
        const b1x = r + r * 0.32 * Math.cos(angle - baseOffset);
        const b1y = r + r * 0.32 * Math.sin(angle - baseOffset);
        const b2x = r + r * 0.32 * Math.cos(angle + baseOffset);
        const b2y = r + r * 0.32 * Math.sin(angle + baseOffset);

        // Control points for bezier curve
        const cp1x = r + r * 0.6 * Math.cos(angle - baseOffset * 1.4);
        const cp1y = r + r * 0.6 * Math.sin(angle - baseOffset * 1.4);
        const cp2x = r + r * 0.6 * Math.cos(angle + baseOffset * 1.4);
        const cp2y = r + r * 0.6 * Math.sin(angle + baseOffset * 1.4);

        // Inner petal (smaller, at 45° offset)
        const iAngle = nextAngle;
        const iTipX = r + r * 0.36 * Math.cos(iAngle);
        const iTipY = r + r * 0.36 * Math.sin(iAngle);
        const ib1x = r + r * 0.18 * Math.cos(iAngle - baseOffset);
        const ib1y = r + r * 0.18 * Math.sin(iAngle - baseOffset);
        const ib2x = r + r * 0.18 * Math.cos(iAngle + baseOffset);
        const ib2y = r + r * 0.18 * Math.sin(iAngle + baseOffset);
        const icp1x = r + r * 0.38 * Math.cos(iAngle - baseOffset * 1.4);
        const icp1y = r + r * 0.38 * Math.sin(iAngle - baseOffset * 1.4);
        const icp2x = r + r * 0.38 * Math.cos(iAngle + baseOffset * 1.4);
        const icp2y = r + r * 0.38 * Math.sin(iAngle + baseOffset * 1.4);

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative SVG element
          <g key={`petal-${i}`}>
            {/* Outer petal */}
            <path
              d={`M ${b1x},${b1y} C ${cp1x},${cp1y} ${tipX},${tipY} ${tipX},${tipY} C ${tipX},${tipY} ${cp2x},${cp2y} ${b2x},${b2y} Z`}
              fill="none"
              stroke="currentColor"
              strokeWidth={size * 0.012}
              strokeLinejoin="round"
            />
            {/* Inner lotus petal */}
            <path
              d={`M ${ib1x},${ib1y} C ${icp1x},${icp1y} ${iTipX},${iTipY} ${iTipX},${iTipY} C ${iTipX},${iTipY} ${icp2x},${icp2y} ${ib2x},${ib2y} Z`}
              fill="currentColor"
              opacity={0.35}
            />
          </g>
        );
      })}

      {/* ── Connecting spokes ────────────────────────────── */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
        const innerX = r + r * 0.28 * Math.cos(angle);
        const innerY = r + r * 0.28 * Math.sin(angle);
        const outerX = r + r * 0.62 * Math.cos(angle);
        const outerY = r + r * 0.62 * Math.sin(angle);
        const spokeKey = `spoke-angle-${Math.round(angle * 1000)}`;
        return (
          <line
            key={spokeKey}
            x1={innerX}
            y1={innerY}
            x2={outerX}
            y2={outerY}
            stroke="currentColor"
            strokeWidth={size * 0.008}
            opacity={0.5}
          />
        );
      })}

      {/* ── Inner geometric ring ─────────────────────────── */}
      <circle
        cx={r}
        cy={r}
        r={r * 0.26}
        fill="none"
        stroke="currentColor"
        strokeWidth={size * 0.016}
      />

      {/* ── Centre Rupee symbol ───────────────────────────── */}
      <g transform={`translate(${r}, ${r})`}>
        {/* Rupee ₹ — drawn as SVG paths for crisp rendering at all sizes */}
        {/* Horizontal bars */}
        <line
          x1={-size * 0.065}
          y1={-size * 0.065}
          x2={size * 0.065}
          y2={-size * 0.065}
          stroke="currentColor"
          strokeWidth={size * 0.022}
          strokeLinecap="round"
        />
        <line
          x1={-size * 0.065}
          y1={-size * 0.02}
          x2={size * 0.05}
          y2={-size * 0.02}
          stroke="currentColor"
          strokeWidth={size * 0.016}
          strokeLinecap="round"
        />
        {/* Vertical stroke */}
        <line
          x1={-size * 0.028}
          y1={-size * 0.065}
          x2={-size * 0.028}
          y2={size * 0.078}
          stroke="currentColor"
          strokeWidth={size * 0.02}
          strokeLinecap="round"
        />
        {/* Diagonal line of ₹ */}
        <line
          x1={size * 0.045}
          y1={-size * 0.02}
          x2={-size * 0.06}
          y2={size * 0.075}
          stroke="currentColor"
          strokeWidth={size * 0.016}
          strokeLinecap="round"
        />
        {/* Arc at top of vertical for the P shape */}
        <path
          d={`M ${-size * 0.028},${-size * 0.065} 
              C ${size * 0.07},${-size * 0.065} 
                ${size * 0.07},${-size * 0.02} 
                ${-size * 0.028},${-size * 0.02}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={size * 0.02}
          strokeLinecap="round"
        />
      </g>

      {/* ── Small economic accent dots (between petals) ───── */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = ((i + 0.5) / 8) * 2 * Math.PI - Math.PI / 2;
        const x = r + r * 0.62 * Math.cos(angle);
        const y = r + r * 0.62 * Math.sin(angle);
        return (
          <circle
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative
            key={`dot-${i}`}
            cx={x}
            cy={y}
            r={size * 0.022}
            fill="currentColor"
            opacity={0.6}
          />
        );
      })}
    </svg>
  );
}
