import { createContext, useContext } from "react";
import type { Inputs } from "../engine/engine";

/** Defaults = baseline. Un paso sin tocar cuenta como neutro y G siempre es calculable. */
export const DEFAULT_INPUTS: Inputs = {
  DF1: [3, 3, 3, 3],
  DF2: Array(13).fill(3),
  DF3: { impact: Array(19).fill(3), likelihood: Array(19).fill(3) },
  DF4: Array(20).fill(2),
};

export interface InputsStore {
  inputs: Inputs;
  setDF1: (v: Inputs["DF1"]) => void;
  setDF2: (v: Inputs["DF2"]) => void;
  setDF3: (v: Inputs["DF3"]) => void;
  setDF4: (v: Inputs["DF4"]) => void;
  reset: () => void;
}

export const InputsContext = createContext<InputsStore | null>(null);

export function useInputs(): InputsStore {
  const ctx = useContext(InputsContext);
  if (!ctx) throw new Error("useInputs debe usarse dentro de <InputsProvider>");
  return ctx;
}
