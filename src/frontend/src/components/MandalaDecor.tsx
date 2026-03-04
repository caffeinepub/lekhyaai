/**
 * Indian Floral Mandala Corner Decoration
 *
 * Classic Indian floral mandala design with:
 * - Lotus flower at the centre (16 petals, teardrop shape)
 * - Marigold ring (12 rounded petals)
 * - Jasmine buds ring (8 flower clusters)
 * - Paisley / boteh leaf accents in the outermost ring
 * - Fine vine-and-dot lace border
 *
 * Colour is driven by CSS `currentColor` so it automatically
 * reacts to any theme change in ThemeContext.
 */

import { cn } from "@/lib/utils";

interface MandalaDecorProps {
  /** Size in pixels. Default 160 */
  size?: number;
  /** 0–1 opacity. Default 0.18 (subtle) */
  opacity?: number;
  className?: string;
  /** Extra inline style */
  style?: React.CSSProperties;
}

export default function MandalaDecor({
  size = 160,
  opacity = 0.18,
  className,
  style,
}: MandalaDecorProps) {
  const cx = size / 2;
  const cy = size / 2;

  // Helper: point on a circle
  const pt = (r: number, angleDeg: number) => {
    const a = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  // Helper: teardrop petal path (lotus shape)
  const lotusPetal = (
    r: number,
    angleDeg: number,
    petalLen: number,
    petalW: number,
  ) => {
    const tip = pt(r + petalLen, angleDeg);
    const base1 = pt(r, angleDeg - petalW);
    const base2 = pt(r, angleDeg + petalW);
    const ctrl1 = pt(r + petalLen * 0.72, angleDeg - petalW * 0.6);
    const ctrl2 = pt(r + petalLen * 0.72, angleDeg + petalW * 0.6);
    return `M ${base1.x},${base1.y} Q ${ctrl1.x},${ctrl1.y} ${tip.x},${tip.y} Q ${ctrl2.x},${ctrl2.y} ${base2.x},${base2.y} Z`;
  };

  // Helper: rounded marigold petal
  const marigoldPetal = (r: number, angleDeg: number, petalLen: number) => {
    const tip = pt(r + petalLen, angleDeg);
    const base1 = pt(r, angleDeg - 9);
    const base2 = pt(r, angleDeg + 9);
    const ctrl = pt(r + petalLen * 0.85, angleDeg);
    return `M ${base1.x},${base1.y} Q ${ctrl.x},${ctrl.y} ${tip.x},${tip.y} Q ${ctrl.x},${ctrl.y} ${base2.x},${base2.y} Z`;
  };

  // Helper: small jasmine flower (5 petals) at a position
  const jasmine = (
    centerX: number,
    centerY: number,
    r: number,
    rotDeg: number,
  ) => {
    return Array.from({ length: 5 }).map((_, i) => {
      const a = rotDeg + (i / 5) * 360;
      const rad = (a - 90) * (Math.PI / 180);
      const tipX = centerX + r * 1.7 * Math.cos(rad);
      const tipY = centerY + r * 1.7 * Math.sin(rad);
      const baseRad1 = (a - 20 - 90) * (Math.PI / 180);
      const baseRad2 = (a + 20 - 90) * (Math.PI / 180);
      const b1x = centerX + r * 0.5 * Math.cos(baseRad1);
      const b1y = centerY + r * 0.5 * Math.sin(baseRad1);
      const b2x = centerX + r * 0.5 * Math.cos(baseRad2);
      const b2y = centerY + r * 0.5 * Math.sin(baseRad2);
      return (
        <path
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative element
          key={`jp-${i}`}
          d={`M ${b1x},${b1y} Q ${tipX},${tipY} ${b2x},${b2y} Z`}
          fill="currentColor"
          opacity={0.7}
        />
      );
    });
  };

  // Helper: paisley / boteh shape
  const paisley = (r: number, angleDeg: number, h: number, w: number) => {
    const base = pt(r, angleDeg);
    const a = (angleDeg - 90) * (Math.PI / 180);
    const nx = Math.cos(a); // radial direction unit vector
    const ny = Math.sin(a);
    const tx = -ny; // tangential direction
    const ty = nx;
    // paisley: teardrop tilted slightly
    const tip = {
      x: base.x + nx * h * 0.95 + tx * w * 0.35,
      y: base.y + ny * h * 0.95 + ty * w * 0.35,
    };
    const ctrl1 = {
      x: base.x + nx * h * 0.6 + tx * w,
      y: base.y + ny * h * 0.6 + ty * w,
    };
    const ctrl2 = {
      x: base.x + nx * h * 0.9 - tx * w * 0.1,
      y: base.y + ny * h * 0.9 - ty * w * 0.1,
    };
    return `M ${base.x},${base.y} C ${ctrl1.x},${ctrl1.y} ${tip.x},${tip.y} ${tip.x},${tip.y} C ${ctrl2.x},${ctrl2.y} ${base.x - tx * w * 0.3},${base.y - ty * w * 0.3} Z`;
  };

  const s = size;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
      style={{ opacity, color: "currentColor", ...style }}
    >
      {/* ── 1. Outermost lace border: vine ring with dot buds ── */}
      <circle
        cx={cx}
        cy={cy}
        r={s * 0.474}
        fill="none"
        stroke="currentColor"
        strokeWidth={s * 0.007}
        strokeDasharray={`${s * 0.028} ${s * 0.018}`}
      />
      {/* Vine leaf dots around outer edge */}
      {Array.from({ length: 24 }).map((_, i) => {
        const p = pt(s * 0.456, (i / 24) * 360);
        return (
          <circle
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative
            key={`vine-${i}`}
            cx={p.x}
            cy={p.y}
            r={s * 0.012}
            fill="currentColor"
            opacity={i % 3 === 0 ? 0.9 : 0.4}
          />
        );
      })}

      {/* ── 2. Paisley / boteh ring (8 paisleys) ──────────── */}
      {Array.from({ length: 8 }).map((_, i) => (
        <path
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative
          key={`paisley-${i}`}
          d={paisley(s * 0.37, (i / 8) * 360, s * 0.07, s * 0.025)}
          fill="none"
          stroke="currentColor"
          strokeWidth={s * 0.012}
          opacity={0.75}
        />
      ))}

      {/* ── 3. Jasmine bud clusters (8 positions) ─────────── */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 360 + 22.5;
        const p = pt(s * 0.33, angle);
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative
          <g key={`jasmine-${i}`}>{jasmine(p.x, p.y, s * 0.022, angle)}</g>
        );
      })}

      {/* ── 4. Marigold ring: 12 rounded petals ───────────── */}
      {Array.from({ length: 12 }).map((_, i) => (
        <path
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative
          key={`marigold-outer-${i}`}
          d={marigoldPetal(s * 0.18, (i / 12) * 360, s * 0.1)}
          fill="none"
          stroke="currentColor"
          strokeWidth={s * 0.013}
          strokeLinejoin="round"
        />
      ))}
      {/* Marigold inner fill petals (alternating) */}
      {Array.from({ length: 12 }).map((_, i) => (
        <path
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative
          key={`marigold-inner-${i}`}
          d={marigoldPetal(s * 0.18, (i / 12) * 360 + 15, s * 0.072)}
          fill="currentColor"
          opacity={0.22}
        />
      ))}

      {/* ── 5. Lotus: 16 outer petals ─────────────────────── */}
      {Array.from({ length: 16 }).map((_, i) => (
        <path
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative
          key={`lotus-outer-${i}`}
          d={lotusPetal(s * 0.1, (i / 16) * 360, s * 0.08, 7)}
          fill="none"
          stroke="currentColor"
          strokeWidth={s * 0.011}
        />
      ))}

      {/* ── 6. Lotus: 8 inner filled petals ──────────────── */}
      {Array.from({ length: 8 }).map((_, i) => (
        <path
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative
          key={`lotus-inner-${i}`}
          d={lotusPetal(s * 0.07, (i / 8) * 360, s * 0.055, 9)}
          fill="currentColor"
          opacity={0.3}
        />
      ))}

      {/* ── 7. Inner geometric ring ───────────────────────── */}
      <circle
        cx={cx}
        cy={cy}
        r={s * 0.068}
        fill="none"
        stroke="currentColor"
        strokeWidth={s * 0.013}
      />
      {/* 8 fine spokes */}
      {Array.from({ length: 8 }).map((_, i) => {
        const inner = pt(s * 0.04, (i / 8) * 360);
        const outer = pt(s * 0.065, (i / 8) * 360);
        return (
          <line
            // biome-ignore lint/suspicious/noArrayIndexKey: static decorative
            key={`spoke-${i}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="currentColor"
            strokeWidth={s * 0.008}
            opacity={0.5}
          />
        );
      })}

      {/* ── 8. Centre: small lotus blossom ────────────────── */}
      {Array.from({ length: 6 }).map((_, i) => (
        <ellipse
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative
          key={`centre-petal-${i}`}
          cx={cx}
          cy={cy - s * 0.022}
          rx={s * 0.014}
          ry={s * 0.028}
          fill="currentColor"
          opacity={0.65}
          transform={`rotate(${(i / 6) * 360} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={s * 0.018} fill="currentColor" />
    </svg>
  );
}
