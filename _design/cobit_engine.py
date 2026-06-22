"""
COBIT 2019 Design Toolkit — Motor de cálculo de referencia.

Reproduce EXACTAMENTE las columnas G (Initial Scope) y Q (Refined Scope) de la
hoja Canvas a partir de los inputs crudos de los 10 design factors (DF1..DF10).

Validado contra el recálculo de LibreOffice del archivo original (coincidencia
exacta en G, Q y en las 10 columnas de importancia relativa, incl. inputs aleatorios).

Uso:
    import json
    from cobit_engine import compute_canvas
    model = json.load(open("cobit_model.json"))
    result = compute_canvas(model, inputs)   # ver formato de `inputs` abajo
    result["G"]  # lista de 40 (initial scope)
    result["Q"]  # lista de 40 (refined scope)
"""
import numpy as np


def mround(x, m=5):
    """Equivalente a Excel MROUND: redondea al múltiplo de m más cercano,
    el .5 redondea alejándose de cero. m debe tener el mismo signo que x."""
    if m == 0:
        return 0.0
    return np.sign(x) * np.floor(np.abs(x) / abs(m) + 0.5) * abs(m)


def _rel_importance(score, basescore, cf):
    """Columna 'Relative Importance' de cada hoja DF (longitud 40).
    D = IFERROR( MROUND(cf*100*score/basescore, 5) - 100 , 0 )
    """
    out = np.zeros(len(score))
    for i in range(len(score)):
        b = basescore[i]
        out[i] = (mround(cf * 100.0 * score[i] / b, 5) - 100) if b else 0.0
    return out


def _factor_vector(model, df_key, raw):
    """Devuelve el vector de importancia relativa (40) de un design factor.

    raw:
      - DF1, DF4, DF7      -> lista de valores (escala 1-5 o 1-3)
      - DF2                -> lista de 13 valores (1-5)
      - DF3                -> dict {"impact":[19], "likelihood":[19]} (1-5 c/u)
      - DF5,6,8,9,10       -> lista de porcentajes que suman 1.0
    """
    M = model["matrices"]
    fac = model["factors"][df_key]

    if df_key == "DF2":
        d = np.array(raw, float)
        base = np.array(fac["baseline"], float)            # 13 x 3
        cf = base.mean() / d.mean()
        ag = d @ np.array(M["DF2_EG_AG"])                  # EG -> AG (13)
        score = ag @ np.array(M["DF2_AG_GMO"])             # AG -> GMO (40)
        basescore = np.array(M["DF2_basescore"], float)    # baseline precalculado
        return _rel_importance(score, basescore, cf)

    if df_key == "DF3":
        imp = np.array(raw["impact"], float)
        lik = np.array(raw["likelihood"], float)
        rating = imp * lik                                 # Risk Rating = I x L
        base = np.array(fac["baseline"], float)            # 19 x 9
        cf = base.mean() / rating.mean()
        mat = np.array(M["DF3_map"])
        return _rel_importance(mat @ rating, mat @ base, cf)

    # Resto: MMULT(mapa, vector). cf = 1 salvo factores con escala 1-5/1-3.
    d = np.array(raw, float)
    base = np.array(fac["baseline"], float)
    mat = np.array(M[f"{df_key}_map"])
    if fac["input_type"].startswith("rating"):             # DF1, DF4, DF7
        cf = base.mean() / d.mean()
    else:                                                  # percent_100 -> cf = 1
        cf = 1.0
    return _rel_importance(mat @ d, mat @ base, cf)


def compute_canvas(model, inputs, weights=None):
    """Calcula columnas G y Q del Canvas.

    inputs: dict con claves DF1..DF10 (ver _factor_vector para el formato de cada una).
    weights: dict opcional {DF1..DF10: peso}. Por defecto todos 1 (Size/DF tiene peso 0).

    Devuelve dict con:
      columns : importancia relativa por factor (10 vectores de 40)  -> Canvas B,C,D,E,I,J,K,L,M,N
      F, P    : sumas ponderadas intermedias (40)                    -> Canvas F y P
      G, Q    : scores finales (40), múltiplos de 5 en rango ~[-100,100]
    """
    if weights is None:
        weights = {k: 1 for k in model["factors"]}

    # 1) Vector de importancia relativa de cada design factor
    cols = {}
    canvas_col = {}
    for df in model["factors"]:
        cols[df] = _factor_vector(model, df, inputs[df])
        canvas_col[model["factors"][df]["canvas_col"]] = cols[df]

    # 2) Sumas ponderadas
    w = weights
    initial = sum(w[df] * cols[df] for df in model["factors"]
                  if model["factors"][df]["step"] == 2)        # F = DF1..DF4
    addition = sum(w[df] * cols[df] for df in model["factors"]
                   if model["factors"][df]["step"] == 3)       # DF5..DF10
    F = np.array(initial, float)
    P = F + np.array(addition, float)

    # 3) Normalización por el mayor valor absoluto de cada columna
    Fmax = max(F.max(), -F.min())
    Pmax = max(P.max(), -P.min())

    G = np.zeros(40)
    Q = np.zeros(40)
    for i in range(40):
        if Fmax:
            G[i] = (mround(np.trunc(100 * F[i] / Fmax), 5) if F[i] >= 0
                    else mround(np.trunc(100 * F[i] / Fmax), -5))
        if Pmax:
            Q[i] = (mround(np.trunc(100 * P[i] / Pmax), 5) if P[i] > 0
                    else mround(np.trunc(100 * P[i] / Pmax), -5))

    return {
        "columns": {k: v.astype(int).tolist() for k, v in canvas_col.items()},
        "F": F.astype(int).tolist(),
        "P": P.astype(int).tolist(),
        "Fmax": int(Fmax),
        "Pmax": int(Pmax),
        "G": G.astype(int).tolist(),
        "Q": Q.astype(int).tolist(),
    }


if __name__ == "__main__":
    import json
    model = json.load(open("cobit_model.json"))
    # Ejemplo con los inputs por defecto del archivo original
    demo = {
        "DF1": [3, 5, 1, 2],
        "DF2": [4, 2, 2, 1, 2, 3, 2, 3, 1, 4, 2, 5, 5],
        "DF3": {"impact":      [2,4,2,4,2,3,3,4,2,3,4,2,3,2,1,3,5,2,4],
                "likelihood":  [2,3,2,4,2,2,4,3,2,3,5,2,3,2,3,3,3,3,4]},
        "DF4": [1,1,2,2,1,1,2,3,3,2,2,2,1,3,3,1,1,2,1,3],
        "DF5": [0.75, 0.25],
        "DF6": [0.25, 0.75, 0.0],
        "DF7": [1, 1, 2, 5],
        "DF8": [0.30, 0.50, 0.20],
        "DF9": [0.50, 0.10, 0.40],
        "DF10": [0.75, 0.15, 0.10],
    }
    r = compute_canvas(model, demo)
    print("Fmax,Pmax =", r["Fmax"], r["Pmax"])
    print("G =", r["G"])
    print("Q =", r["Q"])
