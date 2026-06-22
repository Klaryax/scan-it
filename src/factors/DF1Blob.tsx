import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useInputs } from "../state/inputs";
import { factorOptions } from "../data/model";
import { StepFrame } from "../components/StepFrame";

const C = 240;
const RMIN = 56;
const RMAX = 206;

// Orden = orden de options del JSON (Growth, Innovation, Cost, Client).
// u = vector unitario hacia la esquina; pos = ubicación de la etiqueta.
const CORNERS = [
  { u: [0.7071, -0.7071], pos: "tr" }, // 0 Growth/Acquisition
  { u: [-0.7071, -0.7071], pos: "tl" }, // 1 Innovation/Differentiation
  { u: [-0.7071, 0.7071], pos: "bl" }, // 2 Cost Leadership
  { u: [0.7071, 0.7071], pos: "br" }, // 3 Client Service/Stability
] as const;

const ES_LABEL = [
  "Crecimiento y adquisiciones",
  "Innovación y diferenciación",
  "Liderazgo en costos",
  "Servicio al cliente y estabilidad",
];

const PATH_ORDER = [1, 0, 3, 2];

const radius = (v: number) => RMIN + ((v - 1) / 4) * (RMAX - RMIN);
const point = (i: number, v: number) => ({
  x: C + radius(v) * CORNERS[i].u[0],
  y: C + radius(v) * CORNERS[i].u[1],
});

function blobPath(values: number[]): string {
  const p = PATH_ORDER.map((i) => point(i, values[i]));
  const n = p.length;
  let d = `M ${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + " Z";
}

interface Props {
  onNext: () => void;
}

/** DF1 — Enterprise Strategy. Blob deformable: 4 manijas independientes 1–5. Default 3. */
export function DF1Blob({ onNext }: Props) {
  const { inputs, setDF1 } = useInputs();
  const officialOptions = factorOptions("DF1");
  const values = inputs.DF1;
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState(-1);

  const setValue = (i: number, v: number) => {
    const copy = values.slice();
    copy[i] = Math.max(1, Math.min(5, v));
    setDF1(copy);
  };

  const fromPointer = (i: number, e: ReactPointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const proj = (loc.x - C) * CORNERS[i].u[0] + (loc.y - C) * CORNERS[i].u[1];
    const t = (Math.max(RMIN, Math.min(RMAX, proj)) - RMIN) / (RMAX - RMIN);
    setValue(i, Math.round(1 + t * 4));
  };

  return (
    <StepFrame
      step={1}
      code="DF1"
      eyebrow="Enterprise Strategy"
      title="¿Qué estrategia mueve a tu empresa?"
      sub="Estira cada vértice según cuánto pesa esa estrategia hoy. Son independientes: todas pueden ir al máximo, o quedar muy distintas entre sí."
      profile={
        <>
          Perfil:{" "}
          {ES_LABEL.map((l, i) => (
            <b key={i}>
              {l.split(" ")[0]} {values[i]}
              {i < 3 ? " · " : ""}
            </b>
          ))}
        </>
      }
      nextLabel="Continuar"
      onNext={onNext}
    >
      <div className="stage">
        <svg
          ref={svgRef}
          viewBox="0 0 480 480"
          role="img"
          aria-label="Cuadrante de estrategia con cuatro vértices ajustables de 1 a 5"
        >
          <line className="axis" x1="240" y1="34" x2="240" y2="446" />
          <line className="axis" x1="34" y1="240" x2="446" y2="240" />
          {[1, 2, 3, 4, 5].map((v) => (
            <circle key={v} className="ring" cx={C} cy={C} r={radius(v)} />
          ))}
          {CORNERS.map((o, i) => (
            <line
              key={i}
              className="spoke"
              x1={C}
              y1={C}
              x2={C + RMAX * o.u[0]}
              y2={C + RMAX * o.u[1]}
            />
          ))}
          <path className="blob" d={blobPath(values)} />
          {CORNERS.map((_, i) => {
            const p = point(i, values[i]);
            return (
              <g
                key={i}
                role="slider"
                tabIndex={0}
                aria-label={ES_LABEL[i]}
                aria-valuemin={1}
                aria-valuemax={5}
                aria-valuenow={values[i]}
                style={{ outline: "none" }}
                onPointerDown={(e) => {
                  setDrag(i);
                  (e.currentTarget as Element).setPointerCapture(e.pointerId);
                  e.preventDefault();
                }}
                onPointerMove={(e) => {
                  if (drag === i) fromPointer(i, e);
                }}
                onPointerUp={() => setDrag(-1)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowRight") {
                    setValue(i, values[i] + 1);
                    e.preventDefault();
                  }
                  if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
                    setValue(i, values[i] - 1);
                    e.preventDefault();
                  }
                }}
              >
                <circle className={`handle ${drag === i ? "foc" : ""}`} cx={p.x} cy={p.y} r={11} />
                <circle className="hcore" cx={p.x} cy={p.y} r={3.5} />
              </g>
            );
          })}
        </svg>

        {CORNERS.map((o, i) => (
          <div className={`corner ${o.pos}`} key={i}>
            <div className="cn">{ES_LABEL[i]}</div>
            <div className="co">{officialOptions[i]}</div>
            <div className="cv">
              <b>
                {values[i]}
                <span style={{ color: "var(--faint)" }}>/5</span>
              </b>
              <span className="pips">
                {[1, 2, 3, 4, 5].map((k) => (
                  <s key={k} className={k <= values[i] ? "on" : ""} />
                ))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </StepFrame>
  );
}
