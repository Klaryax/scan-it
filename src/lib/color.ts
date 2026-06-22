/** Rampa divergente del valor G — el único evento cromático (§13.1). */
const STOPS: [number, [number, number, number]][] = [
  [-100, [40, 86, 126]],
  [-50, [108, 144, 176]],
  [0, [201, 200, 193]],
  [50, [206, 145, 86]],
  [100, [163, 61, 39]],
];

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

/** Color RGB para un valor G en [-100, 100]; interpolación lineal entre paradas. */
export function colorForG(g: number): string {
  const x = Math.max(-100, Math.min(100, g));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [x0, c0] = STOPS[i];
    const [x1, c1] = STOPS[i + 1];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0);
      return `rgb(${lerp(c0[0], c1[0], t)},${lerp(c0[1], c1[1], t)},${lerp(c0[2], c1[2], t)})`;
    }
  }
  return "rgb(201,200,193)";
}

/** Formato del valor: +45 · 0 · −10 (signo menos tipográfico). */
export function fmtG(g: number): string {
  if (g > 0) return `+${g}`;
  if (g < 0) return `−${Math.abs(g)}`;
  return "0";
}
