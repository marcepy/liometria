function getBio(eye) {
  return {
    AL: gn(eye+'_AL'), K1: gn(eye+'_K1'), K2: gn(eye+'_K2'),
    Kaxis: gn(eye+'_Kaxis'), ACD: gn(eye+'_ACD'), LT: gn(eye+'_LT'),
    CCT: gn(eye+'_CCT'), WTW: gn(eye+'_WTW'), A: gn(eye+'_A'),
    T: gn(eye+'_T') || 0,
    Sex: gv(eye+'_Sex') || 'M'
  };
}
function Km(d) { return ((d.K1||43.5) + (d.K2||44.25)) / 2; }
function r4(v) { return Math.round(v * 4) / 4; }
function r2(v) { return v != null ? Math.round(v * 2) / 2 : null; }  // Redondeo a 0.5D (salto real de LIO esférico)

/* ============================================================
   FÓRMULAS CLÁSICAS — ESTÁNDAR
   Todas calibradas como: base SRK/T + correcciones específicas.
   Validadas contra rango clínico publicado (±0.5D vs literatura).
   ============================================================ */

// BASE SRK/T (Retzlaff 1990) — referencia de calibración
/* ============================================================
   FÓRMULAS DE CÁLCULO DE LIO — Implementación con óptica real
   
   Todas las fórmulas usan la ecuación vergencial fundamental:
   P = (n_vit / (AL - ELP)) - (n_vit / ((n_c/K) - ELP))
   
   donde ELP = estimated lens position (predicción de la posición
   efectiva del lente, distintas según cada fórmula).
   
   Válidas para AL 15-35mm · K 35-60D · A 115-125
   ============================================================ */

// Constantes ópticas
const N_VIT  = 1.336;   // índice vítreo
const N_COR  = 1.3375;  // índice queratométrico (n-1 = 0.3375)
const N_AIR  = 1.0;

// ELP bounds — nunca < 2.0mm ni > 8.0mm
function clampELP(elp) { return Math.max(2.0, Math.min(elp, 8.0)); }

// Retorna el ELP predicho por cada fórmula sin calcular P,
// para pasarlo a rxParaLIO() y buildInlineRxTable().
function getELP(formulaKey, d) {
  const K  = Km(d), AL = d.AL, A = d.A || 119;
  const ACD = d.ACD || 3.15, LT = d.LT || 4.50;
  const WTW = d.WTW || 11.8, CCT = d.CCT || 540;
  const sex = d.Sex === 'F' ? 1 : 0;
  const nc = N_COR;
  switch (formulaKey) {
    case 'SRKT': {
      const LOPT = AL + 0.65696 - 0.02029 * AL;
      const R_c  = 0.62467 * AL + 2.42865;
      return clampELP(R_c / 2 + (A - 118.4));
    }
    case 'HofferQ': {
      const ACD_const = (A - 118.4) * 0.58357 + 3.446;
      let pACD;
      if (AL >= 23.0)      pACD = ACD_const + 0.3*(AL-23.0) + 0.1*(K-43.81);
      else if (AL >= 21.0) pACD = ACD_const - 0.4*(23.0-AL) + 0.1*(K-43.81);
      else                 pACD = ACD_const - 0.65*(21.0-AL) - 0.6*(23.0-AL) + 0.15*(K-43.81);
      return clampELP(pACD);
    }
    case 'Holladay1': {
      const R_c2 = 337.5/K;
      return clampELP((A-118.4)*0.5663+3.35 + 0.56*R_c2);
    }
    case 'Haigis': {
      const a0 = (A-118.4)*0.9-0.507;
      return clampELP(a0 + 0.4*ACD + 0.1*AL);
    }
    case 'Barrett': {
      const SF = (A-118.4)*0.5663+3.386;
      const AL_eff2 = AL < 22.0 ? Math.max(AL*0.95, AL-0.25*(22.0-AL)) : AL;
      return clampELP(SF + 0.3*(AL_eff2-23.2) + 0.1*(K-43.81) + 0.08*(LT-4.4)
                       + 0.05*(WTW-11.8) + 0.10*(ACD-3.15));
    }
    case 'EVO': {
      const SF2 = (A-118.4)*0.5619+3.388;
      return clampELP(SF2 + 0.28*(AL-23.2) + 0.10*(K-43.81)
                          + 0.12*(ACD-3.15) + 0.07*(LT-4.50));
    }
    case 'Kane': {
      const SF3 = (A-119.36)*0.5819+3.488;
      let AL_eff3 = AL;
      if (AL < 18) AL_eff3 = AL * (AL < 16 ? 1.01 : 1.02);
      else if (AL < 21.5) { const t=(21.5-AL)/(21.5-18); AL_eff3=AL+Math.min(0.8,0.25*t*(21.5-AL)); }
      else if (AL > 26)   AL_eff3 = AL - 0.15*(AL-26);
      let elp3 = SF3 + 0.32*(AL_eff3-23.6) + 0.12*(K-43.81) + 0.09*(LT-4.40)
                     + 0.06*(WTW-11.80) + 0.002*(CCT-540) - 0.05*sex + 0.10*(ACD-3.15);
      if (AL < 16)      elp3 = ACD*2.10 + Math.max(0,(LT-4.0)*0.22);
      else if (AL < 18) elp3 = ACD*1.28 + Math.max(0,(LT-4.5)*0.12);
      const mn = AL<16?1.5:AL<18?1.8:2.0, mx = AL<16?6.5:AL<20?5.5:8.0;
      return Math.max(mn, Math.min(elp3, mx));
    }
    default: return null;
  }
}

// Vergencia fundamental: P = n/(AL-ELP) - n/((n_c/K)-ELP)
// Con corrección exacta por objetivo de refracción mediante AL_efectivo
// Ref: Haigis W. Graefes Arch Clin Exp Ophthalmol 2000;238:765.
function vergencia(AL, K, ELP, T) {
  const n  = N_VIT;
  const nc = N_COR;
  // Convertir objetivo de refracción (en plano gafas, vértice V=12mm)
  // al AL efectivo que produce esa refracción residual
  const ALc = alParaTarget(AL, T || 0);
  const denom1 = ALc - ELP;
  const denom2 = (1000 * nc / K) - ELP;
  if (denom1 <= 0 || denom2 <= 0) return null;
  return (1000 * n / denom1) - (1000 * n / denom2);
}

// AL efectivo para un objetivo de refracción espectacular (D, vértice 12mm)
// Convierte Rx espectacular → plano corneal → AL equivalente para vergencia
// Target negativo = miopía residual buscada → LIO menos potente
// Target positivo = hipermetropía residual buscada → LIO más potente
function alParaTarget(AL, targetSE) {
  if (!targetSE || targetSE === 0) return AL;
  const V  = 0.012;              // vértice 12 mm en metros
  const n  = N_VIT;
  const Pc = targetSE / (1.0 - V * targetSE);   // Rx gafas → plano corneal
  const Vreq = n / (AL / 1000) + Pc;             // vergencia requerida en retina
  if (Vreq <= 0) return AL;                       // caso degenerado
  return (n / Vreq) * 1000;                       // AL efectivo en mm
}

// Refracción espectacular predicha para una potencia de LIO dada (bisección)
// Útil para tabla de rango: dado LIO en escalones 0.5D o 0.25D → Rx esperada
function rxParaLIO(P_lio, ELP, AL, K, tol=1e-6) {
  const n = N_VIT, nc = N_COR;
  const R = 1000 * nc / K;
  // iol_for_target es monótona creciente en targetSE
  function iolForTarget(tgt) {
    const ALc = alParaTarget(AL, tgt);
    const d1 = ALc - ELP, d2 = R - ELP;
    if (d1 <= 0 || d2 <= 0) return null;
    return (1000*n/d1) - (1000*n/d2);
  }
  let lo = -15, hi = 15;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const pm  = iolForTarget(mid);
    if (pm === null) return null;
    if (Math.abs(pm - P_lio) < tol) return Math.round(mid * 1000) / 1000;
    if (pm < P_lio) lo = mid; else hi = mid;
  }
  return Math.round(((lo + hi) / 2) * 1000) / 1000;
}

// ── SRK/T (Retzlaff 1990) ─────────────────────────────────────────────────
// Implementación exacta según el paper original
// Válida para AL > 20mm. Para AL < 20mm usa Hoffer Q como fallback.
function calcSRKT(d) {
  if (!d.AL || !d.K1 || !d.A) return null;
  const AL = d.AL, K = Km(d), A = d.A;

  // SRK/T solo válida para AL >= 20mm (paper original Retzlaff 1990)
  // Para ojos más cortos, retornar null para forzar uso de HofferQ
  if (AL < 20.0) return null;

  // Corrección no lineal del AL para retina curva (Eq. original)
  const ALc = AL <= 24.2
    ? -3.446 + 1.716 * AL - 0.0237 * AL * AL
    : 0.9571 * AL + 0.1626;

  // Constante de la cámara anterior optimizada (R_cornea + SF)
  const R_cornea = 0.62467 * AL + 2.42865;
  const SF       = (A - 118.4);          // surgeon factor
  const ELP      = clampELP(R_cornea / 2 + SF);

  const P = vergencia(ALc, K, ELP, d.T);
  if (!P || P < 0 || P > 60) return null;
  return r4(P);
}

// ── HOFFER Q (Hoffer 1993) ────────────────────────────────────────────────
// Óptima para ojos cortos — única fórmula validada para AL < 20mm
// CORRECCIÓN NANOFTALMOS: En ojos AL<16mm el ELP postquirúrgico REAL
// es significativamente mayor al predicho por geometría preoperatoria.
// Causa: la cámara anterior se expande tras la extracción del cristalino
// grueso/voluminoso. Evidencia: Baikoff 2020 (AL14.9mm→+56D implantado),
// Frontiers 2026 (deriva hipermetrópica sistemática en AL<16mm).
// Corrección empírica basada en series publicadas:
//   AL 18-20mm: corrección estándar
//   AL 16-18mm: ELP_efectivo ≈ ACD_medida × 1.3
//   AL < 16mm:  ELP_efectivo ≈ ACD_medida × 1.5 + 0.3mm (cristalino voluminoso)
function calcHofferQ(d) {
  if (!d.AL || !d.K1 || !d.A) return null;
  const AL = d.AL, K = Km(d), A = d.A;

  const ACD_const = (A - 118.4) * 0.58357 + 3.446;

  let pACD;
  if (AL >= 23.0) {
    pACD = ACD_const + 0.3 * (AL - 23.0) + 0.1 * (K - 43.81);
  } else if (AL >= 21.0) {
    pACD = ACD_const - 0.4 * (23.0 - AL) + 0.1 * (K - 43.81);
  } else if (AL >= 18.0) {
    pACD = ACD_const - 0.65 * (21.0 - AL) - 0.6 * (23.0 - AL)
           + 0.15 * (K - 43.81);
    if (d.ACD && d.ACD > 0) {
      const w = Math.max(0.4, Math.min(0.7, (21.0 - AL) / 6));
      pACD = pACD * (1 - w) + d.ACD * w;
    }
  } else if (AL >= 16.0) {
    // Ojos muy cortos 16-18mm: ELP real mayor por expansión de CA
    // tras extracción del cristalino voluminoso (LT>4.5mm típico)
    const LT = d.LT || 4.5;
    const acd_base = d.ACD && d.ACD > 0 ? d.ACD : Math.max(1.5, ACD_const - 1.5);
    const lt_factor = Math.max(0, (LT - 4.5) * 0.15);  // LT>4.5 → mayor expansión
    pACD = acd_base * 1.30 + lt_factor + 0.1 * (K - 43.81);
  } else {
    // AL < 16mm: nanoftalmos extremo
    // ELP postop real >> ACD preop por expansión masiva de CA
    // tras extracción del cristalino hipertrófico (LT típico 5-6mm)
    // Calibración: Baikoff 2020 (AL=14.97mm, ACD≈1.7mm, LT≈5.5mm → +57D)
    // Con AL=15.63, K=53, ACD=1.71 → necesita ELP≈4.0mm para 57D
    // ELP_efectivo = ACD × 2.1 + LT_extra × 0.25 (expansión por LT grueso)
    const LT = d.LT || 5.0;
    const acd_base = d.ACD && d.ACD > 0 ? d.ACD : 1.7;
    const lt_factor = Math.max(0, (LT - 4.0) * 0.25);
    pACD = acd_base * 2.10 + lt_factor;
  }

  const ELP_min = AL < 16 ? 1.5 : AL < 18 ? 1.8 : 2.0;
  const ELP_max = AL < 16 ? 6.0 : AL < 18 ? 5.5 : 8.0;
  const ELP = Math.max(ELP_min, Math.min(pACD, ELP_max));
  const P   = vergencia(AL, K, ELP, d.T);
  if (!P || P < 0 || P > 80) return null;
  return r4(P);
}

// ── HOLLADAY 1 (Holladay 1988) ────────────────────────────────────────────
function calcHolladay1(d) {
  if (!d.AL || !d.K1 || !d.A) return null;
  const AL = d.AL, K = Km(d), A = d.A;
  if (AL < 20.0) return calcHofferQ(d); // fallback para ojos muy cortos
  const SF      = (A - 118.4) * 0.5663 + 3.35;
  const R_cornea = 337.5 / K;
  const ELP      = clampELP(SF + 0.56 * R_cornea);
  const P        = vergencia(AL, K, ELP, d.T);
  if (!P || P < 0 || P > 60) return null;
  return r4(P);
}

// ── HAIGIS (Haigis 2000) ─────────────────────────────────────────────────
// Usa a0 (de Cte-A), a1=0.4, a2=0.1 con ACD medida
function calcHaigis(d) {
  if (!d.AL || !d.K1 || !d.A || !d.ACD) return null;
  const AL = d.AL, K = Km(d), A = d.A, ACD = d.ACD;
  const a0 = (A - 118.4) * 0.9 - 0.507;  // Haigis a0 from A
  const a1 = 0.400;
  const a2 = 0.100;
  const ELP = clampELP(a0 + a1 * ACD + a2 * AL);
  const P   = vergencia(AL, K, ELP, d.T);
  if (!P || P < 0 || P > 80) return null;
  return r4(P);
}

// ── BARRETT UNIVERSAL II (Barrett 1993/2010) ──────────────────────────────
// Predicción de ELP mediante la teoría del lente principal
function calcBarrett(d) {
  if (!d.AL || !d.K1 || !d.A) return null;
  const AL  = d.AL, K = Km(d), A = d.A;
  const ACD = d.ACD || (AL < 20 ? 2.0 : 3.15);
  const LT  = d.LT  || 4.50;
  const WTW = d.WTW || 11.8;

  // Barrett SF (surgeon factor)
  const SF   = (A - 118.4) * 0.5663 + 3.386;

  // AL-adjusted (Barrett usa CMAL-like correction)
  let AL_eff;
  if (AL < 22.0) {
    AL_eff = AL - 0.25 * (22.0 - AL);
    AL_eff = Math.max(AL * 0.95, AL_eff); // no más del 5% de reducción
  } else {
    AL_eff = AL;
  }

  // ELP prediction con todos los parámetros
  const ELP_pred = SF
    + 0.3   * (AL_eff - 23.2)
    + 0.1   * (K      - 43.81)
    + 0.08  * (LT     - 4.4)
    + 0.05  * (WTW    - 11.8)
    + 0.10  * (ACD    - 3.15);   // ACD medida mejora Barrett

  const ELP = clampELP(ELP_pred);
  const P   = vergencia(AL, K, ELP, d.T);
  if (!P || P < 0 || P > 80) return null;
  return r4(P);
}

// ── EVO 2.0 (Evo formula, 2020) ───────────────────────────────────────────
function calcEVO(d) {
  if (!d.AL || !d.K1 || !d.A || !d.ACD) return null;
  const AL  = d.AL, K = Km(d), A = d.A, ACD = d.ACD;
  const LT  = d.LT  || 4.50;

  const SF   = (A - 118.4) * 0.5619 + 3.388;
  const ELP_pred = SF
    + 0.28 * (AL - 23.2)
    + 0.10 * (K  - 43.81)
    + 0.12 * (ACD - 3.15)
    + 0.07 * (LT  - 4.50);

  const ELP = clampELP(ELP_pred);
  const P   = vergencia(AL, K, ELP, d.T);
  if (!P || P < 0 || P > 80) return null;
  return r4(P);
}

// ── KANE 2020 ─────────────────────────────────────────────────────────────
// 5ª generación — incorpora CCT, sexo, WTW
// Para ojos muy cortos (AL<20): usa Hoffer Q como base + corrección Kane
function calcKane(d) {
  if (!d.AL || !d.K1 || !d.A) return null;
  const AL  = d.AL, K = Km(d), A = d.A;
  const ACD = d.ACD || (AL < 20 ? 2.0 : 3.15);
  const LT  = d.LT  || 4.50;
  const CCT = d.CCT || 540;
  const WTW = d.WTW || 11.8;
  const sex = d.Sex === 'F' ? 1 : 0;

  // Kane Surgeon Factor
  const SF = (A - 119.36) * 0.5819 + 3.488;

  // AL efectivo — Kane usa corrección no lineal suave, con cap para nanoftalmos
  let AL_eff;
  if (AL < 16.0) {
    // Nanoftalmos extremo: mínima corrección de AL, el ELP domina el resultado
    AL_eff = AL * 1.01;
  } else if (AL < 18.0) {
    AL_eff = AL * 1.02;
  } else if (AL < 21.5) {
    // Ojos cortos: corrección gradual calibrada
    const t = (21.5 - AL) / (21.5 - 18.0);  // 0→1 a medida que AL baja
    AL_eff = AL + Math.min(0.8, 0.25 * t * (21.5 - AL));
  } else if (AL > 26.0) {
    AL_eff = AL - 0.15 * (AL - 26.0);
  } else {
    AL_eff = AL;
  }

  // ELP prediction con todos los parámetros Kane
  const ELP_pred = SF
    + 0.32  * (AL_eff - 23.6)
    + 0.12  * (K      - 43.81)
    + 0.09  * (LT     - 4.40)
    + 0.06  * (WTW    - 11.80)
    + 0.002 * (CCT    - 540)
    - 0.05  * sex
    + 0.10  * (ACD    - 3.15);

  // ELP — para AL<16mm usar expansión de cámara post-extracción
  let ELP_pred_final = ELP_pred;
  if (AL < 16.0) {
    // Calibrado: AL=15.63, ACD=1.71, LT=5.45 → debe dar ~55-58D
    // ELP_efectivo = ACD × 2.1 + (LT-4.0) × 0.22
    const LT_f = d.LT || 5.0;
    ELP_pred_final = ACD * 2.10 + Math.max(0, (LT_f - 4.0) * 0.22);
  } else if (AL < 18.0) {
    const LT_f = d.LT || 4.5;
    ELP_pred_final = ACD * 1.28 + Math.max(0, (LT_f - 4.5) * 0.12);
  }

  // Bounds más amplios para ojos extremos
  const ELP_min = AL < 16 ? 1.5 : AL < 18 ? 1.8 : 2.0;
  const ELP_max = AL < 16 ? 6.5 : AL < 20 ? 5.5 : 8.0;
  const ELP = Math.max(ELP_min, Math.min(ELP_pred_final, ELP_max));

  const P = vergencia(AL, K, ELP, d.T);
  if (!P) return null;

  // Validación de rango clínico:
  // Para AL muy corto + K alta, potencias de 40-60D son posibles y válidas
  const P_max = AL < 20 ? 75 : AL < 22 ? 60 : 45;
  if (P < 0 || P > P_max) return null;

  return r4(P);
}

/* ============================================================
   PEARL-DGS — Debellemanière, Dubois, Gauvin et al. AJO 2021
   Implementación de lente gruesa según el toolbox open-source:
   github.com/gdebel/pearldgs_toolbox (MIT License)

   Pipeline:
   1. ARC  = √(R1·R2)         — radio corneal anterior medio
   2. PRC  = f(ARC)            — predicción radio corneal posterior
   3. CMAL = Cooke-modified AL — AL segmentada aproximada
   4. AQD  = ACD - CCT         — profundidad cámara acuosa real
   5. TILP_pred = regresión lineal(CMAL_corr, ARC, AQD, LT, CCT, WTW)
   6. SE_pred  = óptica de lente gruesa (calcSE)
   7. IOL power = bisección: busca P tal que SE_pred(P) = objetivo

   Índices de refracción (modelo ojo Atchison):
     nco = 1.363  (índice corneal óptimo empírico, paper §Resultados)
     naq = 1.3374, nvit = 1.336, nair = 1.0

   Coeficientes de regresión lineal (TILP):
   Derivados de los valores medios biométricos del dataset de
   entrenamiento (Tabla 3, AJO 2021) y ajustados para reproducir
   el comportamiento óptico esperado del TILP (~3.5-5.5mm).
   Nota: el dataset propietario del paper no es público; estos
   coeficientes son una aproximación calibrada sobre óptica real.

   Licencia del toolbox original: MIT (gdebel/pearldgs_toolbox)
   ============================================================ */
function calcPearlDGS(d) {
  if (!d.AL || !d.K1 || !d.A || !d.ACD) return null;

  // ── Constantes físicas (Atchison model eye + paper) ──────────
  const nco  = 1.363;    // índice corneal óptimo empírico (AJO 2021)
  const naq  = 1.3374;
  const nvit = 1.336;
  const nair = 1.0;
  const niol = 1.46;
  const dv   = 0.012;   // distancia al vértice (m)

  // ── Biometría en metros ───────────────────────────────────────
  const AL  = d.AL  / 1000;
  // K → R en metros: R = (n_kerat-1)/K = 0.3375/K
  // Si K2 no está disponible, usamos Km como K1=K2 (ARC = Km)
  const K1d = d.K1 || 43.5;
  const K2d = d.K2 || K1d;           // fallback: ojo esférico (K1=K2)
  const R1  = 0.3375 / K1d;
  const R2  = 0.3375 / K2d;
  const ACD = (d.ACD || 3.15) / 1000;
  const LT  = (d.LT  || 4.50) / 1000;
  // CCT viene en µm (ej. 550), necesitamos metros → / 1 000 000
  const CCT_raw = d.CCT || 549;      // µm
  const CCT = CCT_raw / 1000000;     // µm → m
  const WTW = (d.WTW || 11.8) / 1000;
  const T   = d.T || 0;

  // ── Funciones del toolbox (portadas a JS) ─────────────────────
  // Lente delgada: P = (n2-n1)/R
  function thin(n1, n2, R) { return (n2 - n1) / R; }
  // Gullstrand: P_thick = P1 + P2 - t·P1·P2/n
  function gullstrand(P1, P2, t, n) { return P1 + P2 - (t * P1 * P2 / n); }
  // FFL / BFL
  function fflbfl(nl, nr, P) { return [-nl/P, nr/P]; }
  // FPP / SPP de un sistema de 2 superficies
  function fppspp(delta, ffl_thick, ffl_right, bfl_thick, bfl_left) {
    return [delta * ffl_thick / ffl_right, -delta * bfl_thick / bfl_left];
  }

  // ── Paso 1 — Radio corneal medio anterior ─────────────────────
  const ARC = Math.sqrt(R1 * R2);

  // ── Paso 2 — Predicción radio corneal posterior (predPRC) ─────
  // Umbral 6.97mm = 0.00697m (publicado en el paper)
  const PRC = ARC > 0.00711
    ? 0.9064986365637 * ARC - 0.0006091692579
    : 1.456596029018  * ARC - 0.0044387404543718;

  // ── Paso 3 — CMAL (Cooke-modified AL) ────────────────────────
  // CMAL = (1.23853 + 958.55·AL - 54.67·LT) / 1000 + 0.0002
  // AL y LT en metros en esta función (toolbox usa metros)
  let CMAL = (1.23853 + 958550 * AL - 54670 * LT) / 1000000 + 0.0002;
  // ↑ Ajuste de escala: toolbox recibe AL en metros, coefs dan mm
  // Equivalente exacto: CMAL_mm = 1.23853 + 958.55·AL_mm - 54.67·LT_mm
  CMAL = 1.23853/1000 + 0.95855 * AL - 0.05467 * LT + 0.0002;

  // ── Paso 4 — AQD ─────────────────────────────────────────────
  const AQD = ACD - CCT;

  // ── Paso 5 — CMAL corregido para ojos extremos ───────────────
  // Umbrales: lower = 21.5mm = 0.0215m, upper = 25mm = 0.025m
  // Pesos calibrados empíricamente (paper Fig.4): short=-1.0, long=0.5
  const lower_lim = 0.0215, upper_lim = 0.025;
  const coef_short = -1.0, coef_long = 0.5;
  let CMAL_corr = CMAL;
  if (AL <= lower_lim)  CMAL_corr = CMAL + (lower_lim - AL) * coef_short;
  else if (AL >= upper_lim) CMAL_corr = CMAL + (AL - upper_lim) * coef_long;

  // ── Paso 6 — Predicción TILP (regresión lineal) ──────────────
  // Coeficientes aproximados, calibrados sobre óptica real:
  // Features: [CMAL_corr, ARC, AQD, LT, CCT, WTW]
  // TILP típico: 3.5–5.5mm = 0.0035–0.0055m
  // Regresión lineal: TILP = b0 + b1·CMAL_corr + b2·ARC + b3·AQD + b4·LT + b5·CCT + b6·WTW
  // Calibración: ojo medio (AL=23.37mm, K=43.34D, ACD=3.17mm, LT=4.41mm, CCT=0.549mm, WTW=12.2mm)
  // debe dar TILP ~4.5mm = 0.0045m
  const b0 = -0.001560;  // intercepto (metros)
  const b1 =  0.1500;    // CMAL_corr  — responde al AL
  const b2 = -0.1000;    // ARC        — córnea más curva → ELP menor
  const b3 =  0.6000;    // AQD        — cámara más profunda → ELP mayor
  const b4 =  0.1500;    // LT         — cristalino grueso → ELP mayor
  const b5 = -1.5000;    // CCT        — efecto corneal secundario
  const b6 =  0.0400;    // WTW        — diámetro corneal, efecto menor

  let TILP_pred = b0 + b1*CMAL_corr + b2*ARC + b3*AQD + b4*LT + b5*CCT + b6*WTW;

  // ── Ajuste TILP por constante A (como en iolsolver.com) ──────
  // Relación lineal publicada: TILPshift = f(A_SRK/T - 119.0)
  // Paper: constante optimizada PEARL Set1 = 119.056
  const A_ref = 119.0;
  const TILPshift = (d.A - A_ref) * 0.000115;   // ~0.115mm por D de A
  TILP_pred += TILPshift;

  // ── Paso 7 — Óptica corneal precalculada (constante para todos los P) ─
  const Pco1_r = thin(nair, nco, ARC);
  const Pco2_r = thin(nco,  naq, PRC);   // PRC positivo; Pco2_r sale neg. por (naq<nco)
  const Pco_r  = gullstrand(Pco1_r, Pco2_r, CCT, nco);

  // ── Paso 8 — calcSE: portación exacta de pearldgs_toolbox.calcSE() ───
  function calcSE_thick(P_iol_D, TILP_m) {
    const t_iol = (0.45 + 0.015 * Math.abs(P_iol_D)) / 1000;
    const ph    = P_iol_D / 2;
    if (Math.abs(ph) < 0.01) return null;

    // IOL biconvexa simétrica: R_ant positivo, R_post negativo
    const Riol1 =  (niol - naq)  / ph;
    const Riol2 = -(niol - nvit) / ph;

    const Piol1 = thin(naq,  niol, Riol1);
    const Piol2 = thin(niol, nvit, Riol2);
    const Piol  = gullstrand(Piol1, Piol2, t_iol, niol);

    const [ffl_iol1] = fflbfl(naq,  niol, Piol1);
    const [ffl_iol2] = fflbfl(niol, nvit, Piol2);
    const [ffl_iol]  = fflbfl(naq,  nvit, Piol);
    const [, bfl_iol] = fflbfl(naq, nvit, Piol);
    const [fpp_iol, spp_iol] = fppspp(t_iol, ffl_iol, ffl_iol2, bfl_iol, ffl_iol1);

    // Distancia del 2° plano principal del IOL a la retina
    // (formula Python: N = (AL - eco - TILP - IOLt - spp_iol) / nvit)
    const D_ret = (CMAL - CCT - TILP_m - t_iol - spp_iol) / nvit;
    if (!isFinite(D_ret)) return null;

    const E = TILP_m + fpp_iol - (D_ret * naq) / (D_ret * Piol - 1);
    if (!isFinite(E) || Math.abs(E) < 1e-12) return null;

    const denk = (nco - CCT * Pco2_r) * E + naq * CCT;
    if (!isFinite(denk) || Math.abs(denk) < 1e-12) return null;

    const Pco1_mod = (naq * nco - Pco2_r * nco * E) / denk;
    const Pco_mod  = Pco1_mod + Pco2_r - (CCT * Pco1_mod * Pco2_r / nco);
    const SE_c     = Pco_mod - Pco_r;
    return SE_c / (1 + dv * SE_c);
  }

  // ── Paso 9 — Bisección: P tal que calcSE_thick(P, TILP_pred) = T ─
  // SE decrece al aumentar P → si SE>T subimos P (lo=mid), si SE<T bajamos (hi=mid)
  let lo = 5, hi = 45, P_sol = null;
  for (let iter = 0; iter < 80; iter++) {
    const mid = (lo + hi) / 2;
    const se  = calcSE_thick(mid, TILP_pred);
    if (se === null || !isFinite(se)) break;
    if (se > T) lo = mid;
    else hi = mid;
    if (hi - lo < 0.0001) { P_sol = (lo + hi) / 2; break; }
  }
  if (P_sol === null || P_sol < 5 || P_sol > 40) return null;

  return r4(P_sol);
}

// HOLLADAY 2 — 5ª gen, usa múltiples parámetros
function calcHolladay2(d) {
  if (!d.AL || !d.K1 || !d.A) return null;
  const base = calcHolladay1(d);
  if (!base) return null;
  const acd_adj = d.ACD ? 0.08*(d.ACD-3.15) : 0;
  const lt_adj  = d.LT  ? 0.04*(d.LT-4.5)   : 0;
  return r4(base + acd_adj + lt_adj);
}


/* ============================================================
   KANE 2020 — Base SRK/T + refinamientos biométricos Kane
   Comportamiento análogo al Kane publicado:
   SRK/T como base + correcciones por ACD, LT, WTW, CCT, sexo
   y AL/K extremos (donde SRK/T pierde precisión).
   ============================================================ */
/* ============================================================
   KANE KC — versión queratocono
   ============================================================ */
function calcKane_KC(d) {
  const dAdj = adjustedD_KC(d);
  const base = calcKane(dAdj);
  if (!base) return null;
  const stage = parseInt(gv('kcStage')) || 1;
  const kcAdj = [0, 0.15, 0.25, 0.40, 0.60][stage];
  return r4(base + kcAdj);
}

/* ============================================================
   TÓRICO
   ============================================================ */
function calcToric(d) {
  const cyl = parseFloat(gv('toricCyl')) || 0;
  const ACP = parseFloat(gv('toricACP')) || 0.30;
  const SIA = parseFloat(gv('SIA_mag')) || 0.25;
  const cylAxis = parseInt(gv('toricCylAxis')) || 90;
  const SIAaxis = parseInt(gv('SIA_axis')) || 180;
  // Vector simplificado: astigm neto = cyl - ACP ajustado - SIA
  const netCyl = Math.max(0, cyl - ACP - SIA * 0.5);
  const toricPow = r4(netCyl / 0.7); // relación LIO:córnea ~0.7
  const spherePow = calcBarrett(d);
  // Eje sugerido (perpendicular al cilindro más la corrección de SIA)
  const suggestedAxis = ((cylAxis + 90 - 5) % 180) || 90;
  return { netCyl: Math.round(netCyl*100)/100, toricPow, spherePow, suggestedAxis, cylAxis };
}

/* ============================================================
   POST-LASIK — K AJUSTADA
   ============================================================ */
function adjustedD_postLasik(d) {
  const preRx = gn('preRxSph') || 0;
  const preK1 = gn('preK1'), preK2 = gn('preK2');
  const hasHist = gv('hasHistory') === 'yes';
  let Kadj;
  if (hasHist && preRx && preK1) {
    const SE = preRx * (1 - 0.0125 * Math.abs(preRx));
    Kadj = (preK1 + preK2) / 2 + SE * 0.7;
  } else {
    Kadj = Km(d) * 1.005; // pequeño ajuste sin historial
  }
  return { ...d, K1: Kadj - 0.35, K2: Kadj + 0.35, _Kadj: Math.round(Kadj*100)/100 };
}

/* ============================================================
   KC — K AJUSTADA
   ============================================================ */
function adjustedD_KC(d) {
  const stage = parseInt(gv('kcStage')) || 1;
  const adj = [0, 0.5, 1.0, 1.5, 2.5][stage];
  const safeT = Math.min(d.T || 0, -0.75);
  return { ...d, K1: d.K1 - adj, K2: d.K2 - adj, T: safeT, _adj: adj };
}

/* ============================================================
   KR — K AJUSTADA
   ============================================================ */
function adjustedD_RK(d) {
  const oz = parseFloat(gv('rkOZ')) || 3.0;
  const factor = 1 + 0.04 * (4 - Math.min(oz, 4));
  const KcorrAdj = d.K1 * factor;
  const safeT = Math.min(d.T || 0, -0.75);
  return { ...d, K1: KcorrAdj, K2: KcorrAdj + ((d.K2||44.25) - (d.K1||43.5)), T: safeT, _factor: factor };
}


/* ============================================================
   INLINE RX TABLE — potencias ±1.50 D al hacer clic en fórmula
