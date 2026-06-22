import type { ReactNode } from "react";
import { Wordmark } from "./Wordmark";

interface StepFrameProps {
  step: number; // 1..4
  code: string; // "DF1"
  eyebrow: string;
  title: string;
  sub: string;
  profile?: ReactNode;
  nextLabel: string;
  onBack?: () => void;
  onNext: () => void;
  children: ReactNode;
}

const TOTAL = 4;

export function StepFrame({
  step,
  code,
  eyebrow,
  title,
  sub,
  profile,
  nextLabel,
  onBack,
  onNext,
  children,
}: StepFrameProps) {
  return (
    <div className="shell shell--input">
      <div className="top">
        <Wordmark />
        <div className="eyebrow">
          Paso {step} / {TOTAL}
        </div>
      </div>

      <div className="railrow">
        <div className="rail">
          <i style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>
        <span className="step-label mono">{code}</span>
      </div>

      <div className="step-head">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="sub">{sub}</p>
      </div>

      {children}

      <div className="footrow">
        <div className="profile">{profile}</div>
        <div className="nav-actions">
          {onBack && (
            <button type="button" className="btn btn--ghost" onClick={onBack}>
              Atrás
            </button>
          )}
          <button type="button" className="btn" onClick={onNext}>
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
