import model from "../data/cobit_model.json";

export type DF1 = number[];   // 4 valores, escala 1–5
export type DF2 = number[];   // 13 valores, escala 1–5
export type DF3 = { impact: number[]; likelihood: number[] }; // 19 c/u, 1–5
export type DF4 = number[];   // 20 valores, escala 1–3
export interface Inputs { DF1: DF1; DF2: DF2; DF3: DF3; DF4: DF4; }

const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;

// Excel MROUND al múltiplo de 5 más cercano; el .5 redondea ALEJÁNDOSE de cero.
const mround5 = (x: number) => Math.sign(x) * Math.floor(Math.abs(x) / 5 + 0.5) * 5;

// matriz (R×C) · vector (C) -> vector (R)
const matVec = (M: number[][], v: number[]) =>
  M.map(row => row.reduce((s, a, j) => s + a * v[j], 0));

// vector (R) · matriz (R×C) -> vector (C)   (para la cascada de DF2)
const vecMat = (v: number[], M: number[][]) => {
  const C = M[0].length;
  const out = new Array<number>(C).fill(0);
  for (let r = 0; r < M.length; r++)
    for (let c = 0; c < C; c++) out[c] += v[r] * M[r][c];
  return out;
};

// D = IFERROR( MROUND(cf*100*score/basescore, 5) - 100 , 0 )
const relImportance = (score: number[], basescore: number[], cf: number) =>
  score.map((s, i) => (basescore[i] ? mround5((cf * 100 * s) / basescore[i]) - 100 : 0));

function factorVector(df: "DF1" | "DF2" | "DF3" | "DF4", raw: any): number[] {
  const M = (model as any).matrices;
  const fac = (model as any).factors[df];

  if (df === "DF2") {
    const d = raw as number[];
    const cf = mean(fac.baseline) / mean(d);
    const ag = vecMat(d, M.DF2_EG_AG);        // 13 -> 13  (EG -> AG)
    const score = vecMat(ag, M.DF2_AG_GMO);   // 13 -> 40  (AG -> objetivos)
    return relImportance(score, M.DF2_basescore, cf);
  }
  if (df === "DF3") {
    const { impact, likelihood } = raw as DF3;
    const rating = impact.map((v, i) => v * likelihood[i]); // 19  (I × L)
    const base = fac.baseline as number[];                  // [9]×19
    const cf = mean(base) / mean(rating);
    const mat = M.DF3_map as number[][];                    // 40×19
    return relImportance(matVec(mat, rating), matVec(mat, base), cf);
  }
  // DF1, DF4: escala -> cf = mean(baseline)/mean(inputs)
  const d = raw as number[];
  const base = fac.baseline as number[];
  const mat = M[`${df}_map`] as number[][];                 // 40×N
  const cf = mean(base) / mean(d);
  return relImportance(matVec(mat, d), matVec(mat, base), cf);
}

/** Columna G (40 valores, múltiplos de 5, rango ~[-100, 100]). */
export function computeG(inputs: Inputs): number[] {
  const cols = (["DF1", "DF2", "DF3", "DF4"] as const).map(df =>
    factorVector(df, (inputs as any)[df])
  );
  const F = cols[0].map((_, i) => cols.reduce((s, c) => s + c[i], 0)); // pesos = 1
  const Fmax = Math.max(Math.max(...F), -Math.min(...F));
  if (!Fmax) return F.map(() => 0);
  return F.map(f => mround5(Math.trunc((100 * f) / Fmax)));
}

export const OBJECTIVES = (model as any).objectives as { code: string; name: string }[];
