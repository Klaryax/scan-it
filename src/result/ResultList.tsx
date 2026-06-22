import { useEffect, useState } from "react";
import { OBJECTIVES } from "../engine/engine";
import { colorForG, fmtG } from "../lib/color";
import { Wordmark } from "../components/Wordmark";

const DOMAINS = [
  { code: "EDM", name: "Evaluar, orientar y supervisar" },
  { code: "APO", name: "Alinear, planificar y organizar" },
  { code: "BAI", name: "Construir, adquirir e implementar" },
  { code: "DSS", name: "Entregar, dar servicio y soporte" },
  { code: "MEA", name: "Supervisar, evaluar y valorar" },
] as const;

function InstrumentBar({ g, grown }: { g: number; grown: boolean }) {
  const pct = grown ? (Math.abs(g) / 100) * 50 : 0;
  const side = g >= 0 ? { left: "50%" } : { right: "50%" };
  return (
    <div className="track">
      <div className="grid">
        {[0, 25, 50, 75, 100].map((x) => (
          <i key={x} className={x === 50 ? "mid" : ""} style={{ left: `${x}%` }} />
        ))}
      </div>
      <div className="bar" style={{ width: `${pct}%`, background: colorForG(g), ...side }} />
    </div>
  );
}

interface Props {
  G: number[];
  onEdit: () => void;
}

export function ResultList({ G, onEdit }: Props) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const rows = OBJECTIVES.map((o, i) => ({ code: o.code, name: o.name, g: G[i] }));
  const top = [...rows].sort((a, b) => b.g - a.g).slice(0, 3);
  const ramp = `linear-gradient(90deg,${colorForG(-100)},${colorForG(-50)},${colorForG(0)},${colorForG(50)},${colorForG(100)})`;

  return (
    <div className="shell shell--result">
      <div className="result-top">
        <Wordmark />
        <button type="button" className="btn btn--ghost" onClick={onEdit}>
          Editar factores
        </button>
      </div>

      <div className="hero">
        <div className="eyebrow">COBIT 2019 · Initial Scope</div>
        <h1>Prioridades de tu gobierno de TI</h1>
        <p className="sub">
          Según los factores de diseño que ingresaste, estos son los 40 objetivos de gobierno y
          gestión ordenados por su importancia relativa para tu organización. Lo cálido pide más
          foco; lo frío, menos que la línea base.
        </p>
        <div className="meta">
          <div>
            <b>4 / 4</b>
            <span>Factores ingresados</span>
          </div>
          <div>
            <b>40</b>
            <span>Objetivos evaluados</span>
          </div>
          <div>
            <b className="mono">DF1–DF4</b>
            <span>Alcance inicial</span>
          </div>
          <div>
            <b>Hoy</b>
            <span>Fecha de evaluación</span>
          </div>
        </div>
      </div>

      <div className="focus">
        <div className="focus-head">
          <h2>Foco recomendado</h2>
          <span className="hint">los tres objetivos de mayor prioridad relativa</span>
        </div>
        <div className="cards">
          {top.map((r) => (
            <div className="card" key={r.code}>
              <span className="dot" style={{ background: colorForG(r.g) }} />
              <div className="code mono">{r.code}</div>
              <div className="nm">{r.name}</div>
              <div className="val mono">
                {fmtG(r.g)}
                <span className="scope">/100</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="legend">
        <div>
          <div className="ramp" style={{ background: ramp }} />
          <div className="ends">
            <span>−100</span>
            <span>0</span>
            <span>+100</span>
          </div>
        </div>
        <div className="lab">
          menor prioridad&nbsp;&nbsp;·&nbsp;&nbsp;línea base&nbsp;&nbsp;·&nbsp;&nbsp;mayor prioridad
        </div>
      </div>

      <div>
        {DOMAINS.map((dom) => {
          const drows = rows.filter((r) => r.code.startsWith(dom.code));
          return (
            <div className="domain" key={dom.code}>
              <div className="dhead">
                <span className="dcode">{dom.code}</span>
                <span className="dname">{dom.name}</span>
                <span className="dcount">{drows.length} objetivos</span>
              </div>
              {drows.map((r) => (
                <div className="row" key={r.code}>
                  <span className="rc">{r.code}</span>
                  <span className="rn" title={r.name}>
                    {r.name}
                  </span>
                  <InstrumentBar g={r.g} grown={grown} />
                  <span className="rv">{fmtG(r.g)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="foot">
        <span>Scan IT · generado a partir del COBIT 2019 Design Toolkit</span>
        <span>Alcance DF1–DF4 · columna G</span>
      </div>
    </div>
  );
}
