import model from "./cobit_model.json";

type Factor = { name: string; options: string[]; baseline: number[] };

const factors = (model as { factors: Record<string, Factor> }).factors;

/** Opciones oficiales (del JSON) de un design factor, en orden. */
export function factorOptions(df: "DF1" | "DF2" | "DF3" | "DF4"): string[] {
  return factors[df].options;
}

export function factorName(df: "DF1" | "DF2" | "DF3" | "DF4"): string {
  return factors[df].name;
}
