import { useInputs } from "../state/inputs";
import { factorOptions } from "../data/model";
import { StepFrame } from "../components/StepFrame";

// Agrupación visual por BSC (solo UI, no afecta el cálculo). Ritmo 4–3–4–2.
const GROUPS = [
  { title: "Financiera", from: 0, to: 4 },
  { title: "Cliente", from: 4, to: 7 },
  { title: "Interna", from: 7, to: 11 },
  { title: "Aprendizaje y crecimiento", from: 11, to: 13 },
] as const;

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
      <path
        strokeLinejoin="round"
        d="M12 3.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.77l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85z"
      />
    </svg>
  );
}

interface Props {
  onBack: () => void;
  onNext: () => void;
}

/** DF2 — Enterprise Goals. Estrellas 1–5 por meta (orden EG01…EG13). Default 3. */
export function DF2Stars({ onBack, onNext }: Props) {
  const { inputs, setDF2 } = useInputs();
  const options = factorOptions("DF2");
  const values = inputs.DF2;

  const setValue = (i: number, v: number) => {
    const copy = values.slice();
    copy[i] = v;
    setDF2(copy);
  };

  // "EG01—Portfolio of competitive products and services" -> ["EG01", "Portfolio…"]
  const parse = (opt: string) => {
    const idx = opt.indexOf("—");
    return idx === -1 ? { code: "", name: opt } : { code: opt.slice(0, idx), name: opt.slice(idx + 1) };
  };

  return (
    <StepFrame
      step={2}
      code="DF2"
      eyebrow="Enterprise Goals"
      title="¿Qué metas de empresa pesan más?"
      sub="Califica de 1 a 5 estrellas cuánto importa cada meta corporativa hoy. Son independientes: todas pueden ir alto. Agrupadas por las perspectivas del balanced scorecard."
      nextLabel="Continuar"
      onBack={onBack}
      onNext={onNext}
    >
      {GROUPS.map((g) => (
        <div className="bsc-group" key={g.title}>
          <div className="bsc-head">
            <span className="bsc-title">{g.title}</span>
            <span className="bsc-hint">
              {g.to - g.from} {g.to - g.from === 1 ? "meta" : "metas"}
            </span>
          </div>
          {options.slice(g.from, g.to).map((opt, k) => {
            const i = g.from + k;
            const { code, name } = parse(opt);
            return (
              <div className="star-row" key={i}>
                <div>
                  <div className="star-name">{name}</div>
                  {code && <div className="star-code">{code}</div>}
                </div>
                <div
                  className="stars"
                  role="slider"
                  aria-label={opt}
                  aria-valuemin={1}
                  aria-valuemax={5}
                  aria-valuenow={values[i]}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`star ${s <= values[i] ? "on" : ""}`}
                      aria-label={`${s} estrella${s > 1 ? "s" : ""}`}
                      onClick={() => setValue(i, s)}
                    >
                      <Star filled={s <= values[i]} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </StepFrame>
  );
}
