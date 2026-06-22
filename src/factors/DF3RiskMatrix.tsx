import { useState } from "react";
import { useInputs } from "../state/inputs";
import { factorOptions } from "../data/model";
import { StepFrame } from "../components/StepFrame";

interface Props {
  onBack: () => void;
  onNext: () => void;
}

/** DF3 — Risk Profile. Lista de 19 riesgos + matriz 5×5 (impacto × probabilidad). Default 3/3. */
export function DF3RiskMatrix({ onBack, onNext }: Props) {
  const { inputs, setDF3 } = useInputs();
  const options = factorOptions("DF3");
  const { impact, likelihood } = inputs.DF3;
  const [selected, setSelected] = useState(0);
  const [placed, setPlaced] = useState<Set<number>>(new Set());

  const place = (imp: number, lk: number) => {
    const ni = impact.slice();
    const nl = likelihood.slice();
    ni[selected] = imp;
    nl[selected] = lk;
    setDF3({ impact: ni, likelihood: nl });
    setPlaced((p) => new Set(p).add(selected));
    // avanzar al siguiente riesgo aún sin colocar
    const nextPlaced = new Set(placed).add(selected);
    const next = options.findIndex((_, i) => !nextPlaced.has(i));
    if (next !== -1) setSelected(next);
  };

  // densidad por celda = nº de riesgos colocados en (impacto, probabilidad)
  const countAt = (imp: number, lk: number) =>
    options.reduce(
      (n, _, i) => (placed.has(i) && impact[i] === imp && likelihood[i] === lk ? n + 1 : n),
      0,
    );
  let maxCount = 1;
  for (let imp = 1; imp <= 5; imp++)
    for (let lk = 1; lk <= 5; lk++) maxCount = Math.max(maxCount, countAt(imp, lk));

  return (
    <StepFrame
      step={3}
      code="DF3"
      eyebrow="Risk Profile"
      title="¿Dónde están tus riesgos de TI?"
      sub="Elige un riesgo de la lista y colócalo en la grilla según su impacto y su probabilidad. Lo que no coloques queda en el centro (impacto y probabilidad medios)."
      profile={
        <>
          Colocados: <b>{placed.size}/19</b>
        </>
      }
      nextLabel="Continuar"
      onBack={onBack}
      onNext={onNext}
    >
      <div className="matrix-layout">
        <div className="risk-list">
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              className={`risk-item ${i === selected ? "sel" : ""}`}
              onClick={() => setSelected(i)}
            >
              <span className="risk-idx">{String(i + 1).padStart(2, "0")}</span>
              <span className="risk-text">{opt}</span>
              <span className="risk-rating">
                {placed.has(i) ? `${impact[i]}×${likelihood[i]}` : "—"}
              </span>
            </button>
          ))}
        </div>

        <div className="matrix-panel">
          <div className="grid5">
            <div className="axis-l" style={{ gridRow: "1 / 6", gridColumn: 1 }}>
              Impacto →
            </div>
            {Array.from({ length: 5 }, (_, r) => {
              const imp = 5 - r; // fila superior = impacto 5
              return Array.from({ length: 5 }, (_, c) => {
                const lk = c + 1;
                const count = countAt(imp, lk);
                const isActive = impact[selected] === imp && likelihood[selected] === lk;
                return (
                  <button
                    key={`${imp}-${lk}`}
                    type="button"
                    className={`cell ${isActive ? "active" : ""}`}
                    style={{
                      gridColumn: lk + 1,
                      gridRow: r + 1,
                      background:
                        count > 0
                          ? `rgba(15,110,102,${0.12 + 0.55 * (count / maxCount)})`
                          : undefined,
                    }}
                    aria-label={`Impacto ${imp}, probabilidad ${lk}${count ? `, ${count} riesgos` : ""}`}
                    onClick={() => place(imp, lk)}
                  >
                    {count > 0 ? count : ""}
                  </button>
                );
              });
            })}
            <div className="axis-b" style={{ gridRow: 6, gridColumn: "2 / 7" }}>
              Probabilidad →
            </div>
          </div>
          <p className="matrix-caption">
            Riesgo {String(selected + 1).padStart(2, "0")} seleccionado · clic en una celda para colocarlo
          </p>
        </div>
      </div>
    </StepFrame>
  );
}
