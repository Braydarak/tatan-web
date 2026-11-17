/**
 * Dibujos minimalistas (en línea) de cada prenda, con las flechas de las
 * medidas A y B de la guía de talles. `highlight` resalta una medida.
 */

import type { GarmentKey, MeasureId } from "@/lib/size-guide";

const LINE = "#b9a89b"; // tatan-secundario2
const FILL = "#fffdf7";
const ARROW = "#d27856";

type Arrow = { id: MeasureId; x1: number; y1: number; x2: number; y2: number; lx: number; ly: number };
type Drawing = { viewBox: string; paths: string[]; details?: string[]; dots?: [number, number][]; arrows: Arrow[] };

const DRAWINGS: Record<GarmentKey, Drawing> = {
  body: {
    viewBox: "0 0 200 214",
    paths: [
      "M80 28 Q100 50 120 28 L150 36 L184 118 L166 124 L148 70 L148 150 Q148 176 122 186 L117 202 L83 202 L78 186 Q52 176 52 150 L52 70 L34 124 L16 118 L50 36 Z",
    ],
    details: ["M85 31 Q100 52 115 31", "M181 110 L163 116", "M19 110 L37 116", "M84 196 L116 196"],
    dots: [
      [92, 199],
      [108, 199],
    ],
    arrows: [
      { id: "A", x1: 54, y1: 84, x2: 146, y2: 84, lx: 120, ly: 77 },
      { id: "B", x1: 70, y1: 40, x2: 70, y2: 176, lx: 61, ly: 118 },
    ],
  },
  remera: {
    viewBox: "0 0 200 204",
    paths: [
      "M78 26 Q100 48 122 26 L150 34 L184 64 L167 85 L146 70 L146 192 L54 192 L54 70 L33 85 L16 64 L50 34 Z",
    ],
    details: ["M84 29 Q100 50 116 29", "M54 184 L146 184"],
    arrows: [
      { id: "A", x1: 56, y1: 92, x2: 144, y2: 92, lx: 118, ly: 85 },
      { id: "B", x1: 72, y1: 38, x2: 72, y2: 190, lx: 63, ly: 140 },
    ],
  },
  pantalon: {
    viewBox: "0 0 200 214",
    paths: [
      "M56 30 L144 30 L145 46 L55 46 Z",
      "M55 46 L145 46 L152 200 L112 200 L100 98 L88 200 L48 200 Z",
    ],
    details: ["M48 192 L88 192", "M112 192 L152 192", "M100 46 L100 70"],
    arrows: [
      { id: "A", x1: 56, y1: 18, x2: 144, y2: 18, lx: 100, ly: 11 },
      { id: "B", x1: 168, y1: 30, x2: 168, y2: 200, lx: 180, ly: 118 },
    ],
  },
  ranita: {
    viewBox: "0 0 200 222",
    paths: [
      "M80 28 Q100 50 120 28 L150 36 L184 118 L166 124 L148 70 L148 196 Q148 210 134 210 L112 210 Q104 210 103 200 L100 142 L97 200 Q96 210 88 210 L66 210 Q52 210 52 196 L52 70 L34 124 L16 118 L50 36 Z",
    ],
    details: ["M85 31 Q100 52 115 31", "M181 110 L163 116", "M19 110 L37 116", "M52 196 L97 196", "M103 196 L148 196"],
    arrows: [
      { id: "A", x1: 54, y1: 84, x2: 146, y2: 84, lx: 120, ly: 77 },
      { id: "B", x1: 68, y1: 40, x2: 68, y2: 206, lx: 59, ly: 140 },
    ],
  },
  batita: {
    viewBox: "0 0 200 168",
    paths: [
      "M80 28 Q100 50 120 28 L150 36 L184 118 L166 124 L148 70 L148 152 L52 152 L52 70 L34 124 L16 118 L50 36 Z",
    ],
    details: ["M120 28 Q114 96 74 152", "M181 110 L163 116", "M19 110 L37 116"],
    dots: [[124, 104]],
    arrows: [
      { id: "A", x1: 54, y1: 84, x2: 146, y2: 84, lx: 80, ly: 77 },
      { id: "B", x1: 136, y1: 40, x2: 136, y2: 150, lx: 145, ly: 125 },
    ],
  },
  gorro: {
    viewBox: "0 0 200 200",
    paths: ["M52 146 Q50 52 100 46 Q150 52 148 146 Z", "M48 146 L152 146 L152 170 L48 170 Z"],
    details: ["M48 158 L152 158"],
    arrows: [
      { id: "A", x1: 48, y1: 186, x2: 152, y2: 186, lx: 100, ly: 197 },
      { id: "B", x1: 168, y1: 46, x2: 168, y2: 170, lx: 180, ly: 110 },
    ],
  },
};

export default function GarmentSvg({
  garment,
  highlight,
  className,
  showArrows = true,
}: {
  garment: GarmentKey;
  highlight?: MeasureId | null;
  className?: string;
  /** false = solo el dibujo (para elegir la prenda en el CRM) */
  showArrows?: boolean;
}) {
  const d = DRAWINGS[garment];
  return (
    <svg viewBox={d.viewBox} className={className} role="img" aria-label="Cómo se toman las medidas">
      <defs>
        <marker id="gs-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={ARROW} />
        </marker>
      </defs>
      {d.paths.map((p) => (
        <path key={p} d={p} fill={FILL} stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
      ))}
      {d.details?.map((p) => (
        <path key={p} d={p} fill="none" stroke={LINE} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      ))}
      {d.dots?.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.6" fill={LINE} />)}
      {showArrows &&
        d.arrows.map((a) => {
          const dim = highlight && highlight !== a.id;
          return (
            <g key={a.id} opacity={dim ? 0.25 : 1} style={{ transition: "opacity .2s" }}>
              <line
                x1={a.x1}
                y1={a.y1}
                x2={a.x2}
                y2={a.y2}
                stroke={ARROW}
                strokeWidth={highlight === a.id ? 3 : 2.2}
                markerStart="url(#gs-arrow)"
                markerEnd="url(#gs-arrow)"
              />
              <circle cx={a.lx} cy={a.ly} r="8" fill="#fff" stroke={ARROW} strokeWidth="1.5" />
              <text
                x={a.lx}
                y={a.ly}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontWeight="800"
                fill={ARROW}
                fontFamily="system-ui, sans-serif"
              >
                {a.id}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
