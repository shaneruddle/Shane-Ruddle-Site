import { MouseEvent } from "react";
import { AREAS, AreaId, PattayaArea } from "../lib/areas";

// Stylised (not to scale) map of Pattaya's main residential areas. Each area is a real link to
// its page so the map is crawlable; pass onSelect to handle clicks in place instead.

// Coastline from north to south (x, y in a 400 x 560 viewBox). The sea is drawn over the area
// shapes, which gives them their western edge.
const COAST: [number, number][] = [
  [132, -10], [128, 30], [100, 68], [108, 108], [132, 148], [150, 192], [150, 236],
  [132, 266], [86, 288], [84, 318], [114, 346], [134, 420], [150, 470], [166, 512], [178, 570],
];

// Catmull-Rom through the coast points, as cubic Béziers.
function smooth(points: [number, number][]) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [points[i - 1] ?? points[i], points[i], points[i + 1], points[i + 2] ?? points[i + 1]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}
const COAST_PATH = smooth(COAST);
const SEA_PATH = `M-10,-10 L${COAST[0][0]},-10 ${COAST_PATH.replace(/^M[^C]*/, "")} L-10,570 Z`;

export default function PattayaMap({
  active,
  matched,
  onSelect,
  onHover,
  dark = true,
  className = "",
  title = "Map of Pattaya's main areas",
  interactive = true,
}: {
  active?: AreaId | null;
  /** Areas to emphasise without selecting them (e.g. a matcher result). */
  matched?: AreaId[];
  onSelect?: (area: PattayaArea, e: MouseEvent<Element>) => void;
  onHover?: (area: PattayaArea | null) => void;
  dark?: boolean;
  className?: string;
  title?: string;
  /** false renders plain shapes, for use inside another link. */
  interactive?: boolean;
}) {
  const sea = dark ? "#0f1c27" : "#e8eef2";
  const wave = dark ? "rgba(255,255,255,0.06)" : "rgba(10,10,10,0.06)";
  const label = dark ? "rgba(255,255,255,0.82)" : "rgba(10,10,10,0.78)";
  const quiet = dark ? "rgba(255,255,255,0.35)" : "rgba(10,10,10,0.4)";

  return (
    <svg viewBox="0 0 400 560" role="img" aria-label={title} className={`w-full h-auto select-none rounded-[1.25rem] ${className}`}>
      <title>{title}</title>
      <defs>
        <clipPath id="pm-frame"><rect x="0" y="0" width="400" height="560" rx="20" /></clipPath>
        <pattern id="pm-waves" width="24" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 6 Q6 2 12 6 T24 6" fill="none" stroke={wave} strokeWidth="1" />
        </pattern>
      </defs>

      <g clipPath="url(#pm-frame)">
      {AREAS.map((a) => {
        const on = active === a.id;
        const hit = matched?.includes(a.id);
        const fill = on ? "rgba(212,175,55,0.32)" : hit ? "rgba(212,175,55,0.16)" : dark ? "rgba(255,255,255,0.05)" : "rgba(10,10,10,0.04)";
        const stroke = on || hit ? "#D4AF37" : dark ? "rgba(255,255,255,0.14)" : "rgba(10,10,10,0.12)";
        if (!interactive) {
          return <rect key={a.id} x={a.shape.x} y={a.shape.y} width={a.shape.w} height={a.shape.h} rx="14" fill={fill} stroke={stroke} strokeWidth={on ? 2 : 1} />;
        }
        return (
          <a
            key={a.id}
            href={`/areas/${a.slug}`}
            aria-label={`${a.name}: ${a.tagline}`}
            onClick={(e) => onSelect?.(a, e)}
            onMouseEnter={() => onHover?.(a)}
            onMouseLeave={() => onHover?.(null)}
            onFocus={() => onHover?.(a)}
            onBlur={() => onHover?.(null)}
            className="group cursor-pointer outline-none"
          >
            <rect
              x={a.shape.x}
              y={a.shape.y}
              width={a.shape.w}
              height={a.shape.h}
              rx="14"
              fill={fill}
              stroke={stroke}
              strokeWidth={on ? 2 : 1}
              className="transition-[fill,stroke] duration-200 group-hover:fill-[rgba(212,175,55,0.24)] group-hover:stroke-gold group-focus-visible:stroke-gold"
            />
          </a>
        );
      })}

      {/* Sea over the western edge of the areas */}
      <path d={SEA_PATH} fill={sea} pointerEvents="none" />
      <path d={SEA_PATH} fill="url(#pm-waves)" pointerEvents="none" />
      <path d={COAST_PATH} fill="none" stroke="#D4AF37" strokeOpacity={dark ? 0.55 : 0.7} strokeWidth="1.5" pointerEvents="none" />
      </g>

      {/* Koh Lan */}
      <ellipse cx="36" cy="236" rx="16" ry="9" fill={dark ? "rgba(255,255,255,0.08)" : "rgba(10,10,10,0.08)"} pointerEvents="none" />
      <text x="36" y="258" textAnchor="middle" fontSize="9" letterSpacing="1.5" fill={quiet} pointerEvents="none">KOH LAN</text>
      <text x="40" y="420" fontSize="9" letterSpacing="2.5" fill={quiet} transform="rotate(-90 40 420)" pointerEvents="none">GULF OF THAILAND</text>

      {/* Sukhumvit Road */}
      <line x1="256" y1="0" x2="256" y2="560" stroke={dark ? "rgba(255,255,255,0.3)" : "rgba(10,10,10,0.3)"} strokeWidth="1.5" strokeDasharray="5 5" pointerEvents="none" />
      <text x="264" y="548" fontSize="9" letterSpacing="1.5" fill={quiet} pointerEvents="none">SUKHUMVIT RD</text>

      {AREAS.map((a) => {
        const on = active === a.id || matched?.includes(a.id);
        const words = a.name.split(" & ");
        return (
          <text
            key={a.id}
            x={a.label.x}
            y={a.label.y - (words.length - 1) * 8}
            textAnchor="middle"
            fontSize="17"
            fontFamily="var(--font-serif, Georgia, serif)"
            fill={on ? "#D4AF37" : label}
            pointerEvents="none"
          >
            {words.map((w, i) => (
              <tspan key={w} x={a.label.x} dy={i ? 19 : 0}>{i ? `& ${w}` : w}</tspan>
            ))}
          </text>
        );
      })}

      <text x="392" y="14" textAnchor="end" fontSize="9" letterSpacing="1.5" fill={quiet} pointerEvents="none">N ↑ · NOT TO SCALE</text>
    </svg>
  );
}
