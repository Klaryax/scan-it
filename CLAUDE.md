# Scan IT — guía para retomar

## Qué es
App web que evalúa la unidad de TI de una organización con el método **COBIT 2019**.
Pide **4 design factors** (DF1–DF4) mediante mecánicas gráficas distintas y, al terminar,
calcula **100% en el cliente** la **columna G** del Canvas COBIT (prioridad relativa de los
40 objetivos de gobierno y gestión) y la muestra como lista por dominio. Sin backend.

- Producto: **Scan IT** (repo/cuenta **Klaryax**). Posicionamiento: *scan your IT*.
- Principio de UX no negociable: **no se muestra ningún resultado (G) durante el input.**
  G se calcula y se muestra **solo** al pulsar "Ver resultado" (evita "ajustar para que salga bonito").

## Stack
- **TypeScript + React 19 + Vite 8.**
- Estado global con **React Context** (sin librería externa).
- Cálculo en TS puro; `src/data/cobit_model.json` se importa como módulo (`resolveJsonModule`).
- Tests: **Vitest**. Diseño: tokens CSS en `src/index.css` (sistema "Instrumento sobrio", §13).
- Deploy previsto: **Render Static Site** (`npm run build` → publicar `dist/`).

### Comandos
- `npm run dev` — dev server en `:5173`.
- `npm run test` — Vitest (incluye el golden test del motor).
- `npm run build` — `tsc -b && vite build` → `dist/`.
- `npm run lint` — ESLint.

## Estado actual (hecho)
- **Motor portado** de `_design/cobit_engine.py` a `src/engine/engine.ts`, bit a bit.
  **Golden test verde** (`npm run test` → 2/2): reproduce el demo de Python (`EXPECTED_G`)
  y el caso neutro (todo baseline → 40 ceros). **No modificar el motor sin re-validar el test.**
- **Las 4 mecánicas DF1–DF4 + la pantalla de resultado**, construidas con los tokens de §13
  (IBM Plex Sans/Mono, acento teal `--signal`, el valor G como único evento cromático).
  - DF4 semáforos · DF2 estrellas (agrupadas por BSC) · DF1 blob SVG · DF3 matriz de riesgo 5×5.
  - Resultado: 40 objetivos por dominio con barra-instrumento anclada en 0 + foco top-3.
- Estado global con **defaults = baseline**; se puede volver atrás y editar cualquier factor.
- `npm run dev` y `npm run build` corren limpios.

## Pendiente (no bloquea el MVP)
- **Títulos "amables" DF2 y DF4**: hoy se usa el nombre oficial del JSON. Dejar un mapa
  `friendlyNames: Record<code, string>` aparte, fácil de rellenar.
- **Ejes del cuadrante DF1**: sin rótulo definitivo (placeholder); etiquetas de arquetipo en las esquinas.
- **DF5–DF10 y columna Q**: fuera de alcance del MVP (G solo necesita DF1–DF4).
- **Deploy en Render**: conectar el repo como Static Site (build `npm run build`, publish `dist`).
- **Lint**: `engine.ts` (archivo de referencia) dispara 5 `no-explicit-any`. Se deja así a
  propósito para preservar el port idéntico al golden; no afecta dev/build/test.
- La vista de resultado actual es un **placeholder** del futuro "informe ad-hoc de evaluación".

## Dónde vive cada cosa
```
src/
├─ data/
│  ├─ cobit_model.json     # modelo COBIT (objetivos, factors.options, matrices, baselines)
│  └─ model.ts             # helpers tipados: factorOptions(df), factorName(df)
├─ engine/
│  ├─ engine.ts            # motor → computeG(inputs): number[40]; OBJECTIVES. NO TOCAR sin re-validar
│  └─ engine.test.ts       # golden test (demo → EXPECTED_G; neutro → 40 ceros)
├─ state/
│  ├─ inputs.ts            # Context, useInputs(), DEFAULT_INPUTS (= baseline)
│  └─ InputsProvider.tsx   # provider con el estado de los 4 inputs
├─ factors/
│  ├─ DF1Blob.tsx          # Enterprise Strategy — blob SVG, 4 manijas 1–5 (drag + teclado)
│  ├─ DF2Stars.tsx         # Enterprise Goals — 13 metas, estrellas 1–5, agrupadas por BSC
│  ├─ DF3RiskMatrix.tsx    # Risk Profile — 19 riesgos, matriz 5×5 impacto×probabilidad
│  └─ DF4TrafficLights.tsx # IT-Related Issues — 20 temas, semáforo 1→2→3
├─ result/
│  └─ ResultList.tsx       # 40 objetivos por dominio + barra-instrumento + foco top-3
├─ components/
│  ├─ StepFrame.tsx        # chrome común de cada paso (wordmark, riel de progreso, nav)
│  └─ Wordmark.tsx         # "Scan IT" (cambiable en un solo lugar)
├─ lib/
│  └─ color.ts             # colorForG(g) (rampa divergente §13.1), fmtG(g)
├─ App.tsx                 # flujo DF1→DF2→DF3→DF4→resultado; computeG() solo al final
├─ main.tsx                # monta <InputsProvider><App/></InputsProvider>
└─ index.css               # tokens y estilos del sistema de diseño (§13)
```

## Referencias de diseño (`_design/`)
- `DISENO_CLAUDE_CODE.md` — brief y fuente de verdad de qué construir y cómo (§13 = sistema de diseño).
- `mockup_resultado_A.html` / `mockup_DF1_blob_A.html` — mockups de referencia (resultado e input).
- `cobit_engine.py` / `cobit_model.json` — motor y modelo originales (el JSON está copiado a `src/data/`).
