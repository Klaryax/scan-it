import { useState } from "react";
import { useInputs } from "../state/inputs";
import { factorOptions } from "../data/model";
import { StepFrame } from "../components/StepFrame";

const STATES = [
  { label: "Sin problema", cls: "light-1" }, // 1
  { label: "Con problema", cls: "light-2" }, // 2
  { label: "Problema serio", cls: "light-3" }, // 3
] as const;

interface Props {
  onBack: () => void;
  onNext: () => void;
}

/** DF4 — IT-Related Issues. Tablero de semáforos: cada tema cicla 1→2→3. Default 2. */
export function DF4TrafficLights({ onBack, onNext }: Props) {
  const { inputs, setDF4 } = useInputs();
  const options = factorOptions("DF4");
  const values = inputs.DF4;
  const [touched, setTouched] = useState<Set<number>>(new Set());

  const cycle = (i: number) => {
    const next = (values[i] % 3) + 1; // 1→2→3→1
    const copy = values.slice();
    copy[i] = next;
    setDF4(copy);
    setTouched((t) => new Set(t).add(i));
  };

  const serious = values.filter((v) => v === 3).length;

  return (
    <StepFrame
      step={4}
      code="DF4"
      eyebrow="IT-Related Issues"
      title="¿Qué te está doliendo hoy en TI?"
      sub="Toca cada tema para marcarlo: sin problema, con problema o problema serio. El rojo es lo más urgente de atender; lo que no toques cuenta como neutro."
      profile={
        <>
          Marcados: <b>{touched.size}/20</b>
          {serious > 0 && (
            <>
              {" · "}
              <b>{serious}</b> serios
            </>
          )}
        </>
      }
      nextLabel="Ver resultado"
      onBack={onBack}
      onNext={onNext}
    >
      <div className="lights" role="list">
        {options.map((opt, i) => {
          const state = STATES[values[i] - 1];
          return (
            <button
              key={i}
              type="button"
              role="listitem"
              className={`light-row ${state.cls}`}
              aria-label={`${opt} — ${state.label}`}
              onClick={() => cycle(i)}
            >
              <span className="light-idx">{String(i + 1).padStart(2, "0")}</span>
              <span className="light-name">{opt}</span>
              <span className="light-state">
                <span className="light-dot" aria-hidden="true" />
                <span className="light-label">{state.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </StepFrame>
  );
}
