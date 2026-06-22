# DISEÑO PARA CLAUDE CODE — App COBIT 2019 (MVP: DF1–DF4 → columna G)

> Brief de implementación. Entregar a Claude Code junto con `cobit_model.json`,
> `cobit_engine.py` y `CONOCIMIENTO_PROYECTO.md`. Este documento es la fuente de
> verdad para **qué construir y cómo**; el `CONOCIMIENTO_PROYECTO.md` es el detalle
> conceptual del modelo.

---

## 0. Resumen de una línea

App web React que pide **4 design factors** (DF1–DF4) con mecánicas gráficas distintas,
y al terminar calcula **en el cliente** la columna **G** del Canvas COBIT (prioridad de
los 40 objetivos) y la muestra como **lista simple**. Sin backend.

---

## 1. Alcance del MVP (qué SÍ y qué NO)

**SÍ:**
- 4 pantallas de input: DF1 (blob), DF2 (estrellas), DF3 (matriz de riesgo), DF4 (semáforos).
- Cálculo de la columna **G** 100% en cliente, portando el motor de Python a TS.
- Pantalla de resultado: **lista de los 40 objetivos** agrupados por dominio, con código, nombre y valor G.
- Repo listo para **GitHub + Codespaces** (devcontainer) y build estático para **Render**.

**NO (queda para después):**
- DF5–DF10 y columna Q.
- La visualización "bonita" de G (heatmap/barras/podio) — la lista actual es un **placeholder** que luego se reemplaza por el "informe ad-hoc de evaluación".
- Persistencia, login, multiusuario, i18n.

> **Decisión por defecto a confirmar:** el resultado muestra **los 40 objetivos** (no solo EDM).
> Mostrar solo EDM sería trivial de cambiar (filtrar índices 0–4). Si prefieres EDM por ahora, avísame.

---

## 2. Principio de UX no negociable

**No mostrar ningún resultado (G) durante la carga de inputs**, para no inducir al
usuario a "ajustar para que salga bonito". El feedback durante el input es solo de
*entrada* (progreso, microinteracciones, reflejo del perfil). G se calcula y se muestra
**solo al final**, tras un botón explícito tipo "Ver resultado".

Toda mecánica debe ser **fiel**: valores independientes, todas las opciones pueden ir al
máximo a la vez, y calce 1:1 con la escala real del modelo.

---

## 3. Stack y entorno

- **Lenguaje:** TypeScript.
- **Front:** React 18 + Vite.
- **Animación (opcional MVP):** Framer Motion y/o D3/SVG para el blob (DF1) y el "encendido" de semáforos (DF4). Primero que funcione; luego pulir.
- **Cálculo:** puro TS en cliente (sin backend). El `cobit_model.json` se importa como módulo.
- **Dev:** GitHub Codespaces vía `.devcontainer`.
- **Deploy:** Render como **Static Site** (`npm run build` → publicar `dist/`).

### 3.1 `.devcontainer/devcontainer.json`
```json
{
  "name": "cobit-app",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "forwardPorts": [5173],
  "postCreateCommand": "npm install",
  "postAttachCommand": "npm run dev -- --host",
  "customizations": {
    "vscode": { "extensions": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"] }
  }
}
```
> Vite corre en el puerto **5173**. En Codespaces se expone automáticamente.

### 3.2 Repositorio destino y arranque
- **Repo:** `Klaryax/scan-it` → `https://github.com/Klaryax/scan-it.git` (público, **actualmente vacío**).
- La **raíz del repo es la app** (no anidar en `cobit-app/`; la estructura de §4 cuelga de la raíz).
- Arranque desde repo vacío:
  1. Abrir Codespace sobre `Klaryax/scan-it` (el `.devcontainer` corre `npm install`).
  2. `npm create vite@latest . -- --template react-ts` en la raíz; instalar deps; añadir `vitest`.
  3. Pegar `cobit_model.json`, `engine.ts` y `engine.test.ts`; **hacer pasar el golden test primero**.
  4. Construir la UI con los tokens de §13. Commit + push a `main`.

### 3.3 Render (deploy estático)
- Conectar Render al repo `Klaryax/scan-it` como **Static Site** (auto-deploy en push a `main`).
- Build command: `npm run build` · Publish directory: `dist`
- Sin variables de entorno; sin backend.

---

## 4. Estructura del repo

```
scan-it/   (raíz del repo Klaryax/scan-it)
├─ .devcontainer/devcontainer.json
├─ index.html
├─ package.json
├─ tsconfig.json            # resolveJsonModule: true, esModuleInterop: true
├─ vite.config.ts
├─ public/
└─ src/
   ├─ data/cobit_model.json         # copiar tal cual el artefacto del proyecto
   ├─ engine/engine.ts              # port del motor (ver §5)
   ├─ engine/engine.test.ts         # golden test (ver §5.2)
   ├─ factors/
   │  ├─ DF1Blob.tsx
   │  ├─ DF2Stars.tsx
   │  ├─ DF3RiskMatrix.tsx
   │  └─ DF4TrafficLights.tsx
   ├─ result/ResultList.tsx
   ├─ state/inputs.ts               # estado global de los 4 inputs (Context o Zustand)
   ├─ App.tsx                       # flujo/navegación entre pasos + resultado
   └─ main.tsx
```

`tsconfig.json` debe incluir `"resolveJsonModule": true` y `"esModuleInterop": true`
para poder `import model from "../data/cobit_model.json"`.

---

## 5. El motor de cálculo (la parte crítica: portarlo exacto)

G depende **solo de DF1–DF4** (no se necesita DF5–DF10 para G). El port debe reproducir
`cobit_engine.py` **bit a bit**. Abajo va una implementación de referencia ya escrita;
úsala como `src/engine/engine.ts`.

### 5.1 `src/engine/engine.ts` (referencia lista para usar)
```ts
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
```

### 5.2 Golden test (obligatorio) — `src/engine/engine.test.ts`
El port **debe** reproducir esto exactamente. Si falla, el cálculo está mal portado.
```ts
import { describe, it, expect } from "vitest";
import { computeG } from "./engine";

const DEMO = {
  DF1: [3, 5, 1, 2],
  DF2: [4, 2, 2, 1, 2, 3, 2, 3, 1, 4, 2, 5, 5],
  DF3: {
    impact:     [2,4,2,4,2,3,3,4,2,3,4,2,3,2,1,3,5,2,4],
    likelihood: [2,3,2,4,2,2,4,3,2,3,5,2,3,2,3,3,3,3,4],
  },
  DF4: [1,1,2,2,1,1,2,3,3,2,2,2,1,3,3,1,1,2,1,3],
};

const EXPECTED_G = [
  -10, 20, -15, -5, -50, 10, 40, 45, 100, 15, -40, 45, 55, 10, -10, 5, 25, 15,
  -10, 45, 30, 35, 25, 65, 60, 45, 75, -15, 45, 65, 5, 10, 10, 5, -5, 20, 5,
  -15, -25, -10,
];

describe("computeG", () => {
  it("reproduce el motor de Python con los inputs demo", () => {
    expect(computeG(DEMO)).toEqual(EXPECTED_G);
  });

  it("inputs neutros (todo baseline) => G todo 0", () => {
    const neutral = {
      DF1: [3, 3, 3, 3],
      DF2: Array(13).fill(3),
      DF3: { impact: Array(19).fill(3), likelihood: Array(19).fill(3) },
      DF4: Array(20).fill(2),
    };
    expect(computeG(neutral)).toEqual(Array(40).fill(0));
  });
});
```
> Añadir `vitest` a devDependencies y script `"test": "vitest run"`.

### 5.3 Notas de fidelidad del port
- `mround5` usa `abs` + `sign`, así que cubre el caso `±5` del Excel para positivos y negativos con la misma función.
- **Orientación de matrices (clave):** DF1/DF3/DF4 son `matriz·vector` (`matVec`, la matriz es 40×N). DF2 es `vector·matriz` dos veces (`vecMat`, la cascada EG→AG→objetivos). No invertir.
- `DF2_basescore` es una **constante precalculada** en el JSON (el baseline de DF2 ya pasado por la cascada). No recalcularla.
- `Math.trunc` (hacia cero) **antes** de `mround5` en G.

---

## 6. Flujo de la app

```
Inicio
  → Paso DF1 (blob)      → Paso DF2 (estrellas) → Paso DF3 (matriz) → Paso DF4 (semáforos)
  → [botón "Ver resultado"]  → Resultado (lista de 40)
```

- Barra de progreso global (4 pasos). Permitir volver atrás y editar.
- Cada paso guarda su input en el estado global (`src/state/inputs.ts`).
- El estado arranca con los **defaults = baseline** (ver §7), de modo que un paso sin tocar
  cuenta como neutro y la app siempre puede calcular.
- **No** calcular ni mostrar G hasta pulsar "Ver resultado".

---

## 7. Las 4 mecánicas de input (specs implementables)

Todas leen sus etiquetas/opciones desde `model.factors.DFx.options` para no hardcodear.
El **output de cada mecánica** debe tener exactamente la forma que consume `computeG`.

### DF1 — Enterprise Strategy → **Blob deformable** (cuadrante 2×2)
- **Output:** `number[4]`, cada valor 1–5. **Default:** `[3,3,3,3]`.
- 4 arquetipos en las esquinas (de `options`): `Growth/Acquisition`, `Innovation/Differentiation`, `Cost Leadership`, `Client Service/Stability`.
- Una forma con **4 manijas** (una por esquina); estirar cada manija de 1 a 5 = distancia desde el centro = importancia. Las 4 son **independientes** y todas pueden ir a 5 (blob grande y parejo).
- Renderizar el blob como path SVG cuyos puntos de control dependen de los 4 valores.
- **Pendiente (placeholder):** etiquetas de los dos ejes del cuadrante. Por ahora dejar los nombres de arquetipo en las esquinas y los ejes sin rótulo o con texto provisional.

### DF2 — Enterprise Goals → **Estrellas 1–5** agrupadas por BSC
- **Output:** `number[13]`, cada valor 1–5, en **orden EG01…EG13** (el del JSON). **Default:** `3` cada una.
- Control: 5 estrellas tocables por meta (no sliders).
- **Agrupación visual (solo UI, no afecta el cálculo):** Financiera = EG01–EG04 (4) · Cliente = EG05–EG07 (3) · Interna = EG08–EG11 (4) · Crecimiento = EG12–EG13 (2). Ritmo 4–3–4–2.
- **Pendiente (placeholder):** títulos "amables". Por ahora usar el nombre oficial de `options` (string `EGxx—…`), idealmente con el código en una segunda línea o tooltip. **No perder el nombre oficial.**

### DF3 — Risk Profile → **Lista + matriz de riesgo 5×5**
- **Output:** `{ impact: number[19], likelihood: number[19] }`, cada valor 1–5, en orden de `options`. **Default:** impacto 3 y probabilidad 3 (= rating 9 = baseline) para los riesgos no colocados.
- 19 riesgos en lista lateral; el usuario coloca cada riesgo en una celda de la grilla 5×5 (impacto × probabilidad). La grilla se llena como **mapa de calor de densidad**.
- Seleccionar en la lista ↔ resaltar en la grilla (y viceversa). Contador de progreso.
- **Solapamiento = solo visual** (densidad/conteo). La posición dentro de la celda no significa nada; dos riesgos en la misma celda comparten impacto y probabilidad.

### DF4 — IT-Related Issues → **Tablero de semáforos** (lista)
- **Output:** `number[20]`, cada valor en {1,2,3}, en orden de `options`. **Default (sin marcar):** `2` (neutro/baseline).
- Por tema, semáforo que cicla 🟢 1 *No Issue* → 🟡 2 *Issue* → 🔴 3 *Serious Issue*. **Rojo = más importante de atender.**
- **Lista** (no swipe), para poder revisar/corregir los 20. Micro-animación al ciclar ("tablero que se enciende").
- **Color + etiqueta/ícono** (no solo color), por accesibilidad. Contador de progreso **X/20**; lo no marcado cuenta como 2.
- **Pendiente (placeholder):** títulos "amables" (igual que DF2). Por ahora usar `options` oficial.

---

## 8. El cálculo tras ingresar los valores

- Al pulsar **"Ver resultado"**, ensamblar `Inputs` desde el estado y llamar `computeG(inputs)`.
- Es síncrono e instantáneo (operaciones de matrices pequeñas). No requiere async ni backend.
- Guardar el `G: number[40]` resultante para la pantalla de resultado.

---

## 9. La salida del MVP — `src/result/ResultList.tsx`

Lista simple (placeholder del futuro "informe ad-hoc de evaluación). Por cada objetivo:
**código · nombre · valor G**. Agrupar por los 5 dominios.

- Recorrer `OBJECTIVES` (40, en orden) emparejado con `G[i]`.
- Agrupar por prefijo del código: **EDM** (índices 0–4) · **APO** (5–18) · **BAI** (19–29) · **DSS** (30–35) · **MEA** (36–39).
- Formato por fila sugerido: `EDM01 — Ensured Governance Framework Setting & Maintenance — −10`.
- Sin colores ni gráficos por ahora (eso es la fase siguiente). Solo claridad y que se lea bien.

> Cuando llegue el "informe ad-hoc", esta vista se reemplaza; el resto de la app no cambia.

---

## 10. Decisiones abiertas / placeholders (no bloquean el MVP)

1. **Títulos amables DF2 y DF4** — pendientes. Usar nombre oficial de `options` por ahora; dejar la capa de "nombre amable" como un mapa aparte fácil de rellenar luego (p. ej. `friendlyNames: Record<code, string>`).
2. **Ejes del cuadrante DF1** — sin rótulo definitivo. Placeholder.
3. **Output 40 vs solo EDM** — asumido **40 por dominio** (ver §1).

---

## 11. Criterios de aceptación (Definition of Done)

- [ ] `npm install && npm run dev -- --host` levanta la app en Codespaces (puerto 5173 expuesto).
- [ ] `npm run test` pasa el **golden test** (demo → `EXPECTED_G`) y el **caso neutro** (todo default → 40 ceros).
- [ ] Las 4 mecánicas producen exactamente los *shapes* de §7, con los defaults indicados.
- [ ] **Durante el input no se muestra ningún resultado.** G aparece solo tras "Ver resultado".
- [ ] La pantalla de resultado lista los **40 objetivos** agrupados por dominio con su valor G.
- [ ] Se puede volver atrás y editar cualquier factor; al recalcular, el resultado cambia coherentemente.
- [ ] `npm run build` genera `dist/` desplegable como Static Site en Render.

---

## 12. Orden de trabajo sugerido para Claude Code

1. Scaffold Vite + React + TS, devcontainer, `tsconfig` con `resolveJsonModule`.
2. Copiar `cobit_model.json` a `src/data/`. Pegar `engine.ts` y `engine.test.ts`. **Hacer pasar el golden test primero** (antes de tocar UI).
3. Estado global de inputs con defaults = baseline.
4. Implementar las 4 mecánicas (empezar por DF4 semáforos y DF2 estrellas, que son las más simples; luego DF1 blob y DF3 matriz).
5. Flujo/navegación + botón "Ver resultado".
6. `ResultList` (los 40 por dominio).
7. Build y deploy de prueba en Render.

> Regla de oro: **el cálculo se valida con el test antes de construir la interfaz.** Si el
> golden test pasa, el resto es UI sobre un motor ya confiable.

---

## 13. Sistema de diseño — Dirección "Instrumento sobrio" (A)

Premium, profesional, foco en cliente que evalúa su propia TI. Superficie clara y calmada;
**el dato (G) es el único color**. El *engagement* viene del oficio (precisión, tacto,
motion orquestado), no de un look de juguete. Referencia viva: `mockup_resultado_A.html`
(entregable) y `mockup_DF1_blob_A.html` (input). Derivar TODO color/tipografía de aquí.

### 13.1 Paleta (tokens CSS)
```
--paper   #F3F4F6   superficie de página (neutro frío, NO crema)
--surface #FFFFFF   filas / tarjetas
--ink     #12171E   texto y estructura primaria
--slate   #586273   texto secundario, etiquetas
--faint   #8A93A0   captions, hints
--line    #E4E7EC   hairlines / divisores
--line2   #EDEFF2   divisores muy suaves
--signal  #0F6E66   acento teal de marca (uso disciplinado)
```
Rampa divergente — **solo para el valor G**, el único evento cromático:
```
-100 #28567E · -50 #6C90B0 · 0 #C9C8C1 · +50 #CE9156 · +100 #A33D27
```
Interpolar linealmente para cualquier G. Cálido = mayor prioridad; frío = menor que baseline.

### 13.2 Tipografía
- Display / cuerpo: **IBM Plex Sans** (400 / 500 / 600).
- Datos / códigos / valores: **IBM Plex Mono**, `font-variant-numeric: tabular-nums`
  (códigos EDM01…, valores G, contadores). Es la elección que da el aire "enterprise/técnico" creíble.
- Eyebrows / labels: Plex Sans 500, uppercase, `letter-spacing:.14em`, 11px.
- Jerarquía: h1 26–30px / 600 / tracking −.015em · secciones 13px / 600 · cuerpo 13–15px.
  Nada por debajo de 11px. Cargar Plex por Google Fonts con fallback a fuentes de sistema.

### 13.3 Layout
- Columna centrada (resultado ~940px, input ~760px), mucho aire. `border-radius: 6px`
  (refinado: ni pill ni 0). Hairlines `--line` para estructura. Ritmo vertical generoso (rem).
- Cada factor = un "escenario" enfocado. Riel de progreso fino (Paso X / 4) con relleno teal.

### 13.4 Motion
- Restringido y orquestado. **El momento** es el reveal del resultado: las barras crecen
  desde el centro con stagger leve. Micro-interacciones en hover de filas. Respetar
  `prefers-reduced-motion`. Nada de efectos dispersos (delatan "IA-generado").

### 13.5 Firma
- La **lectura calibrada**: tabla de 40 objetivos, cada uno una barra anclada en 0 con
  rejilla de marcas (−100 / −50 / 0 / +50 / +100). La evaluación como instrumento de medición.
  Esa es la única apuesta de audacia; todo lo demás se mantiene quieto.

### 13.6 Las 4 mecánicas en este lenguaje (premium, no juguete)
- **DF1 blob:** forma SVG fina (relleno teal ~8%, trazo teal) sobre cuadrante en tinta;
  vértices = nodos precisos arrastrables; círculos-guía concéntricos como escala 1–5.
- **DF2 estrellas:** control de 5 segmentos sobrio (estrella en tinta/teal), agrupado por BSC
  con encabezados quietos. Nada de oro brillante.
- **DF3 matriz:** grilla 5×5 con celdas hairline; densidad como rampa de tinte calibrada;
  selección en teal; sin emoji.
- **DF4 semáforos:** **NO emoji.** Estado de 3 segmentos con punto de estado desaturado
  (verde / ámbar / rojo refinados) + etiqueta + ícono, tabular; "se enciende" con transición sutil.
- Transversal: mono tabular para todo código/contador; progreso como riel fino; calma consistente.
  Durante el input se permite reflejar el **perfil ingresado** (no el resultado).

### 13.7 Voz / copy
- Castellano para el chrome de UI; nombres oficiales de objetivos en inglés (del JSON).
- Sentence case, verbos en activa, etiquetas por lo que el usuario controla. El error explica
  qué pasó y cómo seguir; la pantalla vacía invita a actuar.

### 13.8 Nombre de producto
- Producto: **scan-it** (repo/cuenta **Klaryax**). Wordmark: **Scan IT** — "Scan" en `--ink`,
  "IT" en `--signal` (teal), como guiño a "escanea tu I.T.".
- Posicionamiento: *scan your IT* — evalúa tu unidad de TI. Encaja con el sujeto.
- Wordmark en un único `<Wordmark/>` central (cambiable en un solo lugar).

> Nota: §3 mencionaba "primero que funcione, luego pulir". Sigue válido para el orden de
> trabajo (motor → test → UI), pero la UI se construye **desde el principio** con estos tokens,
> no con defaults a reemplazar después.
