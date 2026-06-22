import { useMemo, useState, type ReactNode } from "react";
import type { Inputs } from "../engine/engine";
import { DEFAULT_INPUTS, InputsContext } from "./inputs";

export function InputsProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);

  const store = useMemo(
    () => ({
      inputs,
      setDF1: (v: Inputs["DF1"]) => setInputs((s) => ({ ...s, DF1: v })),
      setDF2: (v: Inputs["DF2"]) => setInputs((s) => ({ ...s, DF2: v })),
      setDF3: (v: Inputs["DF3"]) => setInputs((s) => ({ ...s, DF3: v })),
      setDF4: (v: Inputs["DF4"]) => setInputs((s) => ({ ...s, DF4: v })),
      reset: () => setInputs(DEFAULT_INPUTS),
    }),
    [inputs],
  );

  return <InputsContext value={store}>{children}</InputsContext>;
}
