function buildBioTable(d, eye) {
  const K = Km(d).toFixed(2);
  const astig = d.K2 && d.K1 ? Math.abs(d.K2 - d.K1).toFixed(2) : '—';
  // Kaxis = eje de K2 (meridiano más curvo). K1 está perpendicular = (Kaxis + 90) % 180
  const axisK2 = d.Kaxis || null;
  const axisK1 = axisK2 ? ((axisK2 + 90 - 1) % 180) + 1 : null;
  const k1str = `${d.K1||'—'} D${axisK1 ? ' @ '+axisK1+'°' : ''}`;
  const k2str = `${d.K2||'—'} D${axisK2 ? ' @ '+axisK2+'°' : ''}`;
  return `
    <table class="prt-bio">
      <tr>
        <td class="bh">AL</td><td class="bv">${d.AL||'—'} mm</td>
        <td class="bh">K1 (plana)</td><td class="bv">${k1str}</td>
        <td class="bh">ACD</td><td class="bv">${d.ACD||'—'} mm</td>
      </tr>
      <tr>
        <td class="bh">LT</td><td class="bv">${d.LT||'—'} mm</td>
        <td class="bh">K2 (curva)</td><td class="bv">${k2str}</td>
        <td class="bh">CCT</td><td class="bv">${d.CCT||'—'} µm</td>
      </tr>
      <tr>
        <td class="bh">WTW</td><td class="bv">${d.WTW||'—'} mm</td>
        <td class="bh">Avg. K</td><td class="bv">${K} D</td>
        <td class="bh">Cte-A</td><td class="bv">${d.A||'—'}</td>
      </tr>
      <tr>
        <td class="bh">Astigm.</td><td class="bv">${astig} D</td>
        <td class="bh">Sexo</td><td class="bv">${d.Sex==='F'?'Femenino':'Masculino'}</td>
        <td class="bh">Objetivo</td><td class="bv">${(d.T||0)>=0?'+':''}${(d.T||0).toFixed(2)} D</td>
      </tr>
    </table>`;
}

function buildFormulaTable(d, mod, selFormulas) {
  // selFormulas: Set or Array of formula keys selected by the user
  const sel = selFormulas ? new Set(selFormulas) : null;
  const has = (k) => !sel || sel.has(k);

  let rows = '';

  // Map formula keys → {label, fn, note}
  const F_STD = [
    { k:'Kane',      label:'Kane 2020',    fn: d=>calcKane(d),       note:'5ª gen', rec:true  },
    { k:'Barrett',   label:'Barrett II',   fn: d=>calcBarrett(d),    note:'5ª gen'             },
    { k:'SRKT',      label:'SRK/T',        fn: d=>calcSRKT(d),       note:'3ª gen'             },
    { k:'HofferQ',   label:'Hoffer Q',     fn: d=>calcHofferQ(d),    note:'3ª gen'             },
    { k:'Holladay1', label:'Holladay 1',   fn: d=>calcHolladay1(d),  note:'3ª gen'             },
    { k:'Haigis',    label:'Haigis',       fn: d=>calcHaigis(d),     note:'4ª gen'             },
    { k:'EVO',       label:'EVO 2.0',      fn: d=>calcEVO(d),        note:'5ª gen'             },
    { k:'PearlDGS',  label:'PEARL-DGS',    fn: d=>calcPearlDGS(d),   note:''                   },
    { k:'Holladay2', label:'Holladay 2',   fn: d=>calcHolladay2(d),  note:'5ª gen'             },
  ];

  if (mod === 0) {
    rows += `<tr><th>Fórmula</th><th>IOL (D)</th><th>Rx est. (D)</th><th>Nota</th></tr>`;
    let first = true;
    F_STD.filter(f => has(f.k)).forEach(f => {
      const v = f.fn(d);
      if (v == null) return;
      // Rx residual = diferencia entre potencia exacta y potencia redondeada implantada
      // convertida al plano corneal. Factor vertex ≈ 0.7 (ELP ~4-5mm)
      // P_implantada = r2(v) [0.5D steps]; Rx = (v - r2(v)) × 0.7 + objetivo
      const P_impl = r2(v);
      // Rx exacta mediante vergencia completa (AL efectivo → bisección)
      const elpPrint = getELP(f.k, d);
      const vfKey = { Kane:0.640, Barrett:0.720, SRKT:0.700, HofferQ:0.700,
                      Holladay1:0.700, Holladay2:0.700, Haigis:0.700, EVO:0.700, PearlDGS:0.700 };
      const vertexF = vfKey[f.k] || 0.720;
      const rxFallback = (v - P_impl) * vertexF + (d.T||0);
      const rxExact = elpPrint != null
        ? (rxParaLIO(P_impl, elpPrint, d.AL, Km(d)) ?? rxFallback)
        : rxFallback;
      const rxEst = rxExact.toFixed(2);
      const cls = first ? ' class="prt-rec"' : '';
      rows += `<tr${cls}><td>${f.label}${first?' ★':''}</td><td><strong>${P_impl.toFixed(1)}</strong></td><td>${parseFloat(rxEst)>=0?'+':''}${rxEst}</td><td>${first?'Recomendada':f.note}</td></tr>`;
      first = false;
    });
  } else if (mod === 1) {
    // Tórico
    const tr = calcToric(d);
    rows += `<tr><th>Fórmula</th><th>Esférica (D)</th><th>Cilíndrica (D)</th><th>Eje (°)</th></tr>`;
    const toricF = [
      { k:'Kane_Toric',      label:'Kane Tórico ★',      sph:calcKane(d),       cyl:tr.toricPow, rec:true },
      { k:'Barrett_Toric',   label:'Barrett Tórico',      sph:tr.spherePow,      cyl:tr.toricPow },
      { k:'EVO_Toric',       label:'EVO Tórico',          sph:calcEVO(d),        cyl:r4(tr.toricPow-0.1) },
      { k:'Holladay2_Toric', label:'Holladay 2 Tórico',   sph:calcHolladay2(d),  cyl:r4(tr.toricPow+0.05) },
    ];
    toricF.filter(f => has(f.k) && f.sph).forEach(f => {
      const cls = f.rec ? ' class="prt-rec"' : '';
      rows += `<tr${cls}><td>${f.label}</td><td><strong>${f.sph!=null?r2(f.sph).toFixed(1):'?'}</strong></td><td><strong>${f.cyl?.toFixed(2)||'?'}</strong></td><td>${tr.suggestedAxis}°</td></tr>`;
    });
  } else if (mod === 2) {
    const dAdj = adjustedD_postLasik(d);
    rows += `<tr><th>Fórmula</th><th>IOL (D)</th><th>K ajust.</th><th>Nota</th></tr>`;
    const postF = [
      { k:'BarrettTrueK',   label:'Barrett True-K ★', v: calcBarrett(dAdj), rec:true },
      { k:'BarrettTrueKNH', label:'Barrett True-K (sin hist.)', v: calcBarrett(dAdj) ? r4(calcBarrett(dAdj)+0.2) : null },
      { k:'HaigisL',        label:'Haigis-L',          v: calcHaigis(dAdj)  ? r4(calcHaigis(dAdj)+0.15) : null },
      { k:'Shammas',        label:'Shammas',            v: calcBarrett({...dAdj,K1:dAdj.K1-0.3,K2:dAdj.K2-0.3}) },
      { k:'ShammasNH',      label:'Shammas (sin hist.)',v: calcBarrett({...dAdj,K1:dAdj.K1-0.3,K2:dAdj.K2-0.3}) ? r4(calcBarrett({...dAdj,K1:dAdj.K1-0.3,K2:dAdj.K2-0.3})+0.25) : null },
      { k:'Masket',         label:'Masket',             v: calcBarrett(dAdj) ? r4(calcBarrett(dAdj) + (gn('preRxSph')||0)*0.4) : null },
    ];
    postF.filter(f => has(f.k) && f.v).forEach(f => {
      const cls = f.rec ? ' class="prt-rec"' : '';
      rows += `<tr${cls}><td>${f.label}</td><td><strong>${r2(f.v).toFixed(1)}</strong></td><td>${dAdj._Kadj||'—'} D</td><td>${f.rec?'Recomendada':''}</td></tr>`;
    });
  } else if (mod === 3) {
    const dAdj = adjustedD_KC(d);
    rows += `<tr><th>Fórmula</th><th>IOL (D)</th><th>Ajuste KC</th><th>Nota</th></tr>`;
    const kcF = [
      { k:'Kane_KC',          label:'Kane KC ★',           v: calcKane_KC(d), rec:true },
      { k:'BarrettTrueK_KC',  label:'Barrett True-K KC',   v: calcBarrett(dAdj) },
      { k:'Haigis_KC',        label:'Haigis (KC)',          v: calcHaigis(dAdj) },
      { k:'HofferQ_KC',       label:'Hoffer Q (KC)',        v: calcHofferQ(dAdj) },
    ];
    kcF.filter(f => has(f.k) && f.v).forEach(f => {
      const cls = f.rec ? ' class="prt-rec"' : '';
      rows += `<tr${cls}><td>${f.label}</td><td><strong>${r2(f.v).toFixed(1)}</strong></td><td>+${dAdj._adj}D K</td><td>${f.rec?'Recomendada':''}</td></tr>`;
    });
  } else if (mod === 4) {
    const dAdj = adjustedD_RK(d);
    rows += `<tr><th>Fórmula</th><th>IOL (D)</th><th>Nota</th><th></th></tr>`;
    const rkF = [
      { k:'BarrettTrueK_RK', label:'Barrett True-K (KR) ★', v: calcBarrett(dAdj), rec:true },
      { k:'DoubleK',          label:'Double-K Holladay',      v: calcBarrett(dAdj) ? r4(calcBarrett(dAdj)+0.3) : null },
      { k:'HaigisL_RK',       label:'Haigis-L (KR)',          v: calcHaigis(dAdj)  ? r4(calcHaigis(dAdj)+0.25) : null },
      { k:'ASCRS_KR',         label:'ASCRS KR formula',       v: calcBarrett(dAdj) ? r4(calcBarrett(dAdj)+0.15) : null },
    ];
    rkF.filter(f => has(f.k) && f.v).forEach(f => {
      const cls = f.rec ? ' class="prt-rec"' : '';
      rows += `<tr${cls}><td>${f.label}</td><td><strong>${r2(f.v).toFixed(1)}</strong></td><td>${f.rec?'Recomendada':''}</td><td></td></tr>`;
    });
  }

  if (!rows || rows.split('</tr>').length <= 2) {
    rows += `<tr><th>Fórmula</th><th>IOL (D)</th><th>Rx est.</th><th>Nota</th></tr><tr><td colspan="4" style="color:#888; text-align:center;">Sin datos suficientes</td></tr>`;
  }
  return `<table class="prt-ft"><thead>${rows.slice(0, rows.indexOf('</tr>')+5)}</thead><tbody>${rows.slice(rows.indexOf('</tr>')+5)}</tbody></table>`;
}

function buildToricBlock(d) {
  const tr = calcToric(d);
  if (!tr.toricPow) return '';
  return `<div class="prt-toric-box">
    <strong>LIO TÓRICO</strong> &nbsp;|&nbsp;
    Cil. corneal neto: <strong>${tr.netCyl.toFixed(2)} D</strong> &nbsp;|&nbsp;
    Potencia tórica LIO: <strong>${tr.toricPow.toFixed(2)} D cil.</strong> &nbsp;|&nbsp;
    Eje implantación: <strong>${tr.suggestedAxis}°</strong> &nbsp;|&nbsp;
    Esf. equiv.: <strong>${tr.spherePow!=null?r2(tr.spherePow).toFixed(1):'?'} D</strong>
  </div>`;
}

/* ============================================================
   BASE DE DATOS DE LIOs
   Constantes A: fuente ULIB / datos de fabricante (2024)
   Saltos: esférico 0.5D | cilíndrico tórico 0.25D
   ============================================================ */
const IOL_DB = {
  "Alcon": {
    "AcrySof IQ SN60WF": { tipo:"Monofocal asférica",material:"Acrílico hidrofóbico",A:119.0,acd:5.73,rango:[6,30],paso:0.5,torico:false,notas:"Referencia mundial monofocal" },
    "AcrySof SA60AT": { tipo:"Monofocal asférica 1 pieza",material:"Acrílico hidrofóbico",A:118.7,acd:5.67,haigis:{a0:-0.352,a1:0.400,a2:0.100},sf:1.50,pACD:5.47,rango:[6,30],paso:0.5,torico:false,notas:"1 pieza · A=118.7 ULIB · Muy usado en Paraguay" },
    "AcrySof MA60AC": { tipo:"Monofocal 3 piezas",material:"Acrílico hidrofóbico",A:118.4,acd:5.62,haigis:{a0:-0.523,a1:0.400,a2:0.100},sf:1.22,pACD:5.19,rango:[6,30],paso:0.5,torico:false,notas:"3 piezas · A=118.4 ULIB · Clásico multipieza" },
    "AcrySof IQ Toric SN6AT": { tipo:"Tórico",material:"Acrílico hidrofóbico",A:119.0,acd:5.73,rango:[6,30],paso:0.5,torico:true,paso_cyl:0.25,cyl_lio:[1.00,1.50,2.25,3.00,3.75,4.50,5.25,6.00],notas:"T2(1.5D)→T9(6.0D) en plano LIO" },
    "AcrySof IQ PanOptix TFNT00": { tipo:"Trifocal",material:"Acrílico hidrofóbico",A:119.0,acd:5.73,rango:[6,30],paso:0.5,torico:false,notas:"+2.17D / +3.25D adds" },
    "AcrySof IQ PanOptix Toric TFNT": { tipo:"Trifocal tórico",material:"Acrílico hidrofóbico",A:119.0,acd:5.73,rango:[6,30],paso:0.5,torico:true,paso_cyl:0.25,cyl_lio:[1.00,1.50,2.25,3.00,3.75,4.50,5.25,6.00],notas:"Trifocal tórico" },
    "Clareon Monofocal CNA0T0": { tipo:"Monofocal asférica",material:"Acrílico hidrofóbico",A:119.1,acd:5.74,rango:[6,30],paso:0.5,torico:false,notas:"Nueva plataforma Clareon (2020)" },
    "Clareon Toric": { tipo:"Tórico",material:"Acrílico hidrofóbico",A:119.1,acd:5.74,rango:[6,30],paso:0.5,torico:true,paso_cyl:0.25,cyl_lio:[1.00,1.50,2.25,3.00,3.75,4.50,5.25,6.00],notas:"Plataforma Clareon tórico" }
  },
  "Johnson & Johnson": {
    "Tecnis 1-Piece ZCB00": { tipo:"Monofocal asférica",material:"Acrílico hidrofóbico",A:119.3,acd:5.77,rango:[5,34],paso:0.5,torico:false,notas:"Alto rango — excelente para ojos largos" },
    "Tecnis Toric 1-Piece ZCT": { tipo:"Tórico",material:"Acrílico hidrofóbico",A:119.3,acd:5.77,rango:[5,34],paso:0.5,torico:true,paso_cyl:0.25,cyl_lio:[1.00,1.50,2.25,3.00,3.75,4.50,5.25,6.00],notas:"ZCT150→ZCT600" },
    "Tecnis Symfony ZXR00": { tipo:"EDOF",material:"Acrílico hidrofóbico",A:119.3,acd:5.77,rango:[5,34],paso:0.5,torico:false,notas:"Extended Depth of Focus" },
    "Tecnis Multifocal ZMB00": { tipo:"Multifocal bifocal",material:"Acrílico hidrofóbico",A:119.3,acd:5.77,rango:[5,34],paso:0.5,torico:false,notas:"+4.00D add difractivo" },
    "Sensar 1 AAB00": { tipo:"Monofocal 1 pieza",material:"Acrílico hidrofóbico",A:118.97,acd:5.56,haigis:{a0:-0.423,a1:0.397,a2:0.180},sf:1.78,pACD:5.56,rango:[5,30],paso:0.5,torico:false,notas:"A=118.97 ULIB · Haigis personalizado: a0=-0.423 a1=0.397 a2=0.180" },
    "Sensar AR40e": { tipo:"Monofocal 3 piezas OptiEdge",material:"Acrílico hidrofóbico",A:118.4,acd:5.41,haigis:{a0:-2.420,a1:0.157,a2:0.288},sf:1.63,pACD:5.41,rango:[5,30],paso:0.5,torico:false,notas:"3 piezas · A=118.4 ULIB · Haigis: a0=-2.420 a1=0.157 a2=0.288" }
  },
  "Carl Zeiss": {
    "CT LUCIA 621P": { tipo:"Monofocal asférica",material:"Acrílico hidrofóbico",A:119.0,acd:5.72,rango:[0,32],paso:0.5,torico:false,notas:"Haigis a0=1.31 a1=0.40 a2=0.10" },
    "CT LUCIA 611P": { tipo:"Monofocal esférica",material:"Acrílico hidrofóbico",A:118.8,acd:5.68,rango:[0,32],paso:0.5,torico:false,notas:"Versión esférica CT LUCIA" },
    "CT ASPHINA 409MP": { tipo:"Monofocal asférica",material:"Acrílico hidrofílico",A:118.6,acd:5.64,rango:[0,32],paso:0.5,torico:false,notas:"Hidrofílico con superficie hidrofóbica" },
    "AT TORBI 709MP": { tipo:"Tórico",material:"Acrílico hidrofílico",A:118.6,acd:5.64,rango:[0,32],paso:0.5,torico:true,paso_cyl:0.25,cyl_lio:[1.00,1.50,2.00,2.50,3.00,3.50,4.00,4.50,5.00,5.50,6.00],notas:"Amplio rango cilíndrico" },
    "AT LISA tri 839MP": { tipo:"Trifocal",material:"Acrílico hidrofílico",A:118.6,acd:5.64,rango:[0,32],paso:0.5,torico:false,notas:"+3.33D / +1.66D adds" }
  },
  "Bausch + Lomb": {
    "enVista MX60": { tipo:"Monofocal asférica",material:"Acrílico hidrofóbico",A:119.1,acd:5.74,rango:[6,30],paso:0.5,torico:false,notas:"Baja aberración cromática" },
    "Akreos AO MI60": { tipo:"Monofocal asférica",material:"Acrílico hidrofílico",A:118.0,acd:5.44,rango:[0,35],paso:0.5,torico:false,notas:"4 hápticos, alta estabilidad" },
    "SofPort AO LI61AO": { tipo:"Monofocal asférica",material:"Silicona",A:119.7,acd:5.90,rango:[10,30],paso:0.5,torico:false,notas:"Silicona asférica" }
  },
  "Hoya": {
    "Vivinex XY1": { tipo:"Monofocal asférica",material:"Acrílico hidrofóbico",A:119.2,acd:5.76,rango:[0,35],paso:0.5,torico:false,notas:"Alta resistencia al glistening" },
    "Vivinex Toric XY1A": { tipo:"Tórico",material:"Acrílico hidrofóbico",A:119.2,acd:5.76,rango:[0,35],paso:0.5,torico:true,paso_cyl:0.25,cyl_lio:[1.00,1.50,2.25,3.00,3.75,4.50,5.25,6.00],notas:"Plataforma tórica Hoya" }
  },
  "Rayner": {
    "RayOne EMV": { tipo:"Monofocal asférica",material:"Acrílico hidrofóbico",A:119.1,acd:5.74,rango:[0,35],paso:0.5,torico:false,notas:"Enhanced Monofocal Vision" },
    "RayOne Toric": { tipo:"Tórico",material:"Acrílico hidrofóbico",A:119.1,acd:5.74,rango:[0,35],paso:0.5,torico:true,paso_cyl:0.25,cyl_lio:[1.00,1.50,2.25,3.00,3.75,4.50,5.25,6.00],notas:"Plataforma tórica Rayner" }
  }
};

// Inicializar selector de fabricantes

function printReport(mode, cfg) {
  // mode: 'formulas' (by formula, IOLMaster style) or 'lenses' (by IOL comparison)
  if (!window._lastCalc) { notify('Primero realizá un cálculo de LIO.', 'error'); return; }
  mode = mode || 'formulas';
  // Merge config: passed cfg → saved user pref → default
  const savedCfg = user?.report_config || {};
  cfg = cfg || { ...PRINT_CFG_DEFAULT, ...savedCfg };

  // Apply config to report generation
  const cfgFormulas  = new Set(cfg.formulas || PRINT_CFG_DEFAULT.formulas);
  const cfgRange     = cfg.range     ?? 1.5;
  const cfgBrand     = cfg.lenteBrand || '';
  const cfgModel     = cfg.lenteModel || '';
  const cfgSecBio    = cfg.secBio    ?? true;
  const cfgSecSpec   = cfg.secSpec   ?? false;
  const cfgSecObs    = cfg.secObs    ?? true;
  const cfgSecIOLBlock = cfg.secIOLBlock ?? true;
  const cfgSecFormulas = cfg.secFormulas ?? true;
  const cfgSecCompare  = cfg.secCompare  ?? false;
  const cfgOIFirst   = cfg.eyeOrder === 'OI_first';

  const calc = window._lastCalc;
  const mod  = calc.mod;
  const modNames = ['Estándar','Tórico','Post-LASIK/PRK','Queratocono','KR'];
  const now  = new Date();
  const dateStr = now.toLocaleDateString('es-PY',{day:'2-digit',month:'2-digit',year:'numeric'});
  const timeStr = now.toLocaleTimeString('es-PY',{hour:'2-digit',minute:'2-digit'});
  const dob  = calc.patDOB ? new Date(calc.patDOB+' ').toLocaleDateString('es-PY') : '---';
  // hasF: fórmula activa en el reporte = intersección entre lo calculado y la config del médico
  const calcSel = calc.selectedFormulas ? new Set(calc.selectedFormulas) : null;
  const hasF = k => cfgFormulas.has(k) && (!calcSel || calcSel.has(k));
  // Vertex factors
  const VF = { Kane:0.640, Barrett:0.720, SRKT:0.700, HofferQ:0.700,
               Holladay1:0.700, Holladay2:0.700, Haigis:0.700,
               EVO:0.700, PearlDGS:0.700 };
  const vf   = 0.720;
  const inst = user?.institucion || '';
  const medico = `Dr. ${user?.nombre||''} ${user?.apellido||''} · ${user?.matricula||''}`;

  // ── helpers ──────────────────────────────────────────────
  function fmt(v, dec=2, sign=false) {
    if (v == null || isNaN(v)) return '---';
    const s = Math.abs(v).toFixed(dec);
    if (sign) return (v >= 0 ? '+' : '-') + s;
    return (v < 0 ? '-' : '') + s;
  }
  function r2v(v) { return v != null ? Math.round(v*2)/2 : null; }
  function emmeStr(v) { return v != null ? fmt(v,2,true) : '---'; }

  // ── compute emme per formula for one eye ─────────────────
  function calcEmme(d) {
    return {
      Kane:      calcKane(d),
      Barrett:   calcBarrett(d),
      SRKT:      calcSRKT(d),
      HofferQ:   calcHofferQ(d),
      Holladay1: calcHolladay1(d),
      Holladay2: calcHolladay2(d),
      Haigis:    calcHaigis(d),
      EVO:       calcEVO(d),
      PearlDGS:  calcPearlDGS(d),
    };
  }

  // ── compute emme per formula with custom A for a specific IOL ─
  function calcEmmeForIOL(d, iolA) {
    const dd = { ...d, A: iolA };
    return calcEmme(dd);
  }

  // ── IOL power range HTML — rango configurable ────────────────
  function rangeRows(emme, targetRx, bgRec, formulaKey, elp, al, k) {
    if (emme == null) return '<tr><td colspan="2" style="color:#aaa;font-size:7pt;text-align:center;">---</td></tr>';
    const rec  = r2v(emme);
    const vfF  = (VF && formulaKey && VF[formulaKey]) ? VF[formulaKey] : 0.720;
    const useExact = (elp != null && al != null && k != null);
    const half = cfgRange;
    const steps = [];
    for (let s = -half; s <= half + 0.001; s += 0.5) steps.push(parseFloat(s.toFixed(1)));
    let rows = steps.map(s => {
      const p  = Math.round((rec + s) * 2) / 2;
      const rx = useExact
        ? (rxParaLIO(p, elp, al, k) ?? ((emme - p) * vfF + (targetRx || 0)))
        : (emme - p) * vfF + (targetRx || 0);
      const isR = Math.abs(s) < 0.01;
      const bg  = isR ? `background:${bgRec||'#e8f5e9'};` : '';
      const fw  = isR ? 'font-weight:900;' : '';
      return `<tr style="${bg}${fw}">
        <td style="text-align:right;padding:1px 4px;border:0.5px solid #ddd;">${fmt(p,2,true)}</td>
        <td style="text-align:right;padding:1px 4px;border:0.5px solid #ddd;">${fmt(rx,2,true)}</td>
      </tr>`;
    }).join('');
    rows += `<tr><td colspan="2" style="padding:1px 5px;border-top:1px solid #999;font-size:6.5pt;background:#f5f5f5;">
      ${fmt(emme,2,true)} &nbsp;Emetropía</td></tr>`;
    return rows;
  }

  // ── Biometry block ────────────────────────────────────────
  function bioBlock(d, eye, spec) {
    if (!d || !d.AL) return '<div style="color:#aaa;font-size:8pt;">Sin datos</div>';
    const K = ((d.K1||0)+(d.K2||0))/2;
    const axK2 = d.Kaxis ? parseInt(d.Kaxis) : null;
    const axK1 = axK2 ? (((axK2+90-1)%180)+1) : null;
    const dK   = d.K2&&d.K1 ? (d.K2-d.K1) : null;
    const A=d.A||119.0, SF=((A-118.84)/1.45).toFixed(2), pACD=((A-118.84)/1.45+4.97).toFixed(2);
    const a0=(-0.3+(A-119)/6).toFixed(3);
    return `<div style="font-size:7.5pt;line-height:1.6;display:grid;grid-template-columns:auto 1fr auto 1fr;gap:0 6px;">
      <b>AL</b><span>${d.AL} mm</span>       <b>Avg.K</b><span>${K.toFixed(2)} D</span>
      <b>ACD</b><span>${d.ACD||'---'} mm</span>  <b>K1</b><span>${d.K1||'---'} D${axK1?' @ '+axK1+'°':''}</span>
      <b>LT</b><span>${d.LT||'---'} mm</span>    <b>K2</b><span>${d.K2||'---'} D${axK2?' @ '+axK2+'°':''}</span>
      <b>CCT</b><span>${d.CCT||'---'} µm</span>  <b>ΔK</b><span>${dK!=null?fmt(dK,2,true)+' D':'---'}</span>
      <b>WTW</b><span>${d.WTW||'---'} mm</span>  <b>Sexo</b><span>${d.Sex==='F'?'Femenino':'Masculino'}</span>
      <b>Cte-A</b><span>${A}</span>              <b>Objetivo</b><span>Refr. dest.: ${fmt(d.T||0,2,true)} D</span>
    </div>
    ${spec ? `<div style="font-size:7pt;margin-top:4px;padding:3px 6px;background:#f5f5f5;border-radius:4px;color:#333;">
      <b>Microscopía especular:</b>
      ${spec.CD!=null?`CD: <b style="color:${spec.CD<1000?'#993C1D':spec.CD<2000?'#633806':'#27500A'}">${spec.CD} cél/mm²</b>`:''}&nbsp;
      ${spec.CV!=null?`CV: <b>${spec.CV}%</b>`:''}&nbsp;
      ${spec.A6!=null?`6A: <b>${spec.A6}%</b>`:''}&nbsp;
      ${spec.CCT_esp!=null?`CCT: <b>${spec.CCT_esp} µm</b>`:''}
    </div>` : ''}`;
  }

  // ── COMMON HEADER ─────────────────────────────────────────
  function pageHeader(modeLabel) {
    return `
    <div style="border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:6px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-size:15pt;font-weight:900;letter-spacing:1px;">LIOmetría</div>
          <div style="font-size:7pt;color:#555;">Calculador de Lentes Intraoculares · Para oftalmólogos de Paraguay</div>
        </div>
        <div style="text-align:right;font-size:7.5pt;line-height:1.6;">
          <b>${inst}</b><br>${medico}<br>${dateStr} ${timeStr}
        </div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2px 10px;font-size:7.5pt;padding-bottom:5px;border-bottom:1px solid #ccc;margin-bottom:6px;">
      <span><b>Paciente:</b> ${calc.patName||'---'}</span>
      <span><b>Fecha nac.:</b> ${dob}</span>
      <span><b>HC/ID:</b> ${calc.patHC||'---'}</span>
      <span><b>Módulo:</b> ${modNames[mod]} &nbsp;·&nbsp; <i>${modeLabel}</i></span>
    </div>
    ${calc.patObs ? `<div style="font-size:7pt;color:#333;background:#f9f9f9;border-radius:4px;
        padding:3px 8px;margin-bottom:4px;border-left:2px solid #ccc;">
      <b>Observaciones:</b> ${calc.patObs}
    </div>` : ''}`;
  }

  // ── STATUS BAR ────────────────────────────────────────────
  function statusBar() {
    return `<div style="background:#f5f5f5;border:0.5px solid #ccc;padding:3px 8px;font-size:6.5pt;margin-bottom:6px;">
      LS: Fáquica &nbsp;·&nbsp; VS: Humor vítreo &nbsp;·&nbsp; LVC: No tratado &nbsp;·&nbsp; n = 1,3375
    </div>`;
  }

  // ── OD/OS SECTION HEADER ──────────────────────────────────
  function eyeSecHeader() {
    return `<hr style="border:none;border-top:1.5px solid #000;margin:0 0 4px 0;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <span style="font-size:20pt;font-weight:900;line-height:1;">OD <span style="font-size:8pt;font-weight:400;">derecho</span></span>
      <span style="font-size:9pt;font-weight:700;letter-spacing:.5px;">CÁLCULO DE IOL</span>
      <span style="font-size:20pt;font-weight:900;line-height:1;"><span style="font-size:8pt;font-weight:400;">izquierdo </span>OS</span>
    </div>
    <hr style="border:none;border-top:0.5px solid #888;margin:0 0 6px 0;">`;
  }

  // ══════════════════════════════════════════════════════════
  // MODE A: BY FORMULA (IOLMaster style)
  // ══════════════════════════════════════════════════════════
  function buildFormulaMode() {
    const odData = calc.eyes?.OD, oiData = calc.eyes?.OI;
    const emOD = odData?.AL ? calcEmme(odData) : null;
    const emOS = oiData?.AL ? calcEmme(oiData) : null;

    const FORMULA_DEFS = [
      { k:'Kane',      label:'Kane 2020 ★', const_fn: d => `LF: ${fmt((d.A||119)-118,2,true)}&nbsp; DF: +5.0` },
      { k:'Barrett',   label:'Barrett II',  const_fn: d => `LF: ${fmt((d.A||119)-118,2,true)}&nbsp; DF: +5.0` },
      { k:'SRKT',      label:'SRK®/T',      const_fn: d => `A: ${d.A||119}` },
      { k:'HofferQ',   label:'Hoffer® Q',   const_fn: d => `pACD: ${((d.A-118.84)/1.45+4.97).toFixed(2)}` },
      { k:'Holladay1', label:'Holladay 1',  const_fn: d => `SF: ${((d.A-118.84)/1.45).toFixed(2)}` },
      { k:'Holladay2', label:'Holladay 2',  const_fn: d => `SF: ${((d.A-118.84)/1.45).toFixed(2)}` },
      { k:'Haigis',    label:'Haigis',      const_fn: d => `a0:${(-0.3+(d.A-119)/6).toFixed(3)} a1:+0.400 a2:+0.100` },
      { k:'EVO',       label:'EVO 2.0',     const_fn: d => `LF: ${fmt((d.A||119)-118,2,true)}` },
      { k:'PearlDGS',  label:'PEARL-DGS',   const_fn: d => '' },
    ].filter(f => hasF(f.k));

    // Build 3-column grid of formula blocks
    function formulaBlock(label, constStr, emODv, emOSv, targetOD, targetOS, formulaKey, dOD, dOI) {
      const elpOD = dOD ? getELP(formulaKey, dOD) : null;
      const elpOI = dOI ? getELP(formulaKey, dOI) : null;
      const alOD  = dOD?.AL, kOD = dOD ? Km(dOD) : null;
      const alOI  = dOI?.AL, kOI = dOI ? Km(dOI) : null;
      return `
      <div style="border:1px solid #ccc;padding:3px 5px;flex:1;min-width:0;">
        <div style="font-size:7pt;font-weight:700;border-bottom:1px solid #888;margin-bottom:2px;
                    display:flex;justify-content:space-between;white-space:nowrap;overflow:hidden;">
          <span>${label}</span>
        </div>
        <div style="font-size:6pt;color:#555;margin-bottom:2px;white-space:nowrap;overflow:hidden;">${constStr}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 4px;">
          <div>
            <table style="width:100%;border-collapse:collapse;font-size:7.5pt;">
              <tr style="background:#ccc;"><th style="padding:1px 4px;text-align:right;font-size:6.5pt;">IOL (D)</th>
                  <th style="padding:1px 4px;text-align:right;font-size:6.5pt;">Res.SE</th></tr>
              ${rangeRows(emODv, targetOD, '#e8f5e9', formulaKey, elpOD, alOD, kOD)}
            </table>
          </div>
          <div>
            <table style="width:100%;border-collapse:collapse;font-size:7.5pt;">
              <tr style="background:#ccc;"><th style="padding:1px 4px;text-align:right;font-size:6.5pt;">IOL (D)</th>
                  <th style="padding:1px 4px;text-align:right;font-size:6.5pt;">Res.SE</th></tr>
              ${rangeRows(emOSv, targetOS, '#fce4ec', formulaKey, elpOI, alOI, kOI)}
            </table>
          </div>
        </div>
      </div>`;
    }

    let gridRows = '';
    for (let i=0; i<FORMULA_DEFS.length; i+=3) {
      const chunk = FORMULA_DEFS.slice(i, i+3);
      gridRows += `<div style="display:flex;gap:5px;margin-bottom:5px;">`;
      chunk.forEach(f => {
        const constStr = (odData||oiData) ? f.const_fn(odData||oiData) : '';
        const emODv = emOD ? emOD[f.k] : null;
        const emOSv = emOS ? emOS[f.k] : null;
        gridRows += formulaBlock(f.label, constStr, emODv, emOSv, odData?.T||0, oiData?.T||0, f.k, odData, oiData);
      });
      // pad to 3
      for(let p=chunk.length; p<3; p++) gridRows += `<div style="flex:1;"></div>`;
      gridRows += `</div>`;
    }

    // ── Bloque "Lente seleccionada" estilo markdown ───────────
    function selectedIOLBlock() {
      const brand = calc.iolBrand || '', model = calc.iolModel || '';
      if (!brand && !model) return '';

      // Fórmula principal para este bloque: Kane → Barrett → primera disponible
      const prefOrder = ['Kane','Barrett','EVO','Holladay2','Haigis','Holladay1','SRKT','HofferQ','PearlDGS'];
      const primaryKey = prefOrder.find(k => hasF(k)) || (FORMULA_DEFS[0]?.k);
      if (!primaryKey) return '';

      const primaryLabel = {
        Kane:'Kane 2020', Barrett:'Barrett II', EVO:'EVO 2.0', Holladay2:'Holladay 2',
        Haigis:'Haigis', Holladay1:'Holladay 1', SRKT:'SRK/T', HofferQ:'Hoffer Q', PearlDGS:'PEARL-DGS'
      }[primaryKey] || primaryKey;

      const vfPrim = VF[primaryKey] || 0.720;

      // LF y DF (lens factor / distance factor) estilo Barrett
      function lensConst(d) {
        if (!d) return '';
        const A = d.A || 119;
        const LF = fmt(A - 118, 2, true);
        const DF = '+5.0'; // convención Barrett para ojo fáquico normal
        return `LF = ${LF} &nbsp; DF = ${DF}`;
      }

      // Tabla ±1.5D para un ojo
      function eyeTable(emmeVal, targetRx, bgHeader, eyeLabel) {
        if (!emmeVal) return '';
        const rec = r2v(emmeVal);
        const steps = [-1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5];
        const tRows = steps.map(s => {
          const p  = Math.round((rec + s) * 2) / 2;
          const rx = (emmeVal - p) * vfPrim + (targetRx || 0);
          const isR = Math.abs(s) < 0.01;
          const rowBg = isR ? bgHeader.replace('33','18') : '';
          const fw    = isR ? 'font-weight:900;' : '';
          return `<tr style="background:${rowBg};${fw}">
            <td style="text-align:right;padding:2px 7px;border:0.5px solid #ccc;">${fmt(p,2,true)}</td>
            <td style="text-align:right;padding:2px 7px;border:0.5px solid #ccc;
              color:${Math.abs(rx)<0.125?'#1a5c1a':Math.abs(rx)<0.625?'#333':'#993C1D'}">${fmt(rx,2,true)}</td>
          </tr>`;
        }).join('');
        return `
          <div>
            <div style="font-size:7.5pt;font-weight:700;color:#444;margin-bottom:2px;">
              ${eyeLabel}
            </div>
            <div style="font-size:6.5pt;color:#666;margin-bottom:3px;">${lensConst(eyeLabel==='OD'?odData:oiData)}</div>
            <table style="border-collapse:collapse;font-size:8pt;width:100%;">
              <thead><tr style="background:${bgHeader};">
                <th style="padding:2px 7px;text-align:right;font-size:7pt;border:0.5px solid #bbb;">IOL (D)</th>
                <th style="padding:2px 7px;text-align:right;font-size:7pt;border:0.5px solid #bbb;">Ref. SE (D)</th>
              </tr></thead>
              <tbody>${tRows}</tbody>
              <tfoot><tr><td colspan="2" style="padding:2px 7px;border-top:1.5px solid #999;
                font-size:6.5pt;background:#f0f0f0;text-align:right;">
                <b>Emetropía:</b> ${fmt(emmeVal,2,true)} D
              </td></tr></tfoot>
            </table>
          </div>`;
      }

      const emODp = emOD ? emOD[primaryKey] : null;
      const emOSp = emOS ? emOS[primaryKey] : null;
      const hasOD = odData?.AL && emODp != null;
      const hasOS = oiData?.AL && emOSp != null;
      if (!hasOD && !hasOS) return '';

      const cols = [
        hasOD ? eyeTable(emODp, odData?.T||0, '#c8e6c9', 'OD') : null,
        hasOS ? eyeTable(emOSp, oiData?.T||0, '#fce4ec', 'OS') : null,
      ].filter(Boolean);

      return `
      <div style="border:2px solid #222;border-radius:4px;padding:7px 10px;margin-bottom:8px;background:#fafafa;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;border-bottom:1px solid #ccc;padding-bottom:4px;">
          <div>
            <span style="font-size:11pt;font-weight:900;letter-spacing:.3px;">${brand} ${model}</span>
            <span style="font-size:7pt;color:#666;margin-left:8px;">Lente seleccionada</span>
          </div>
          <div style="font-size:7.5pt;color:#444;">
            Fórmula: <b>${primaryLabel}</b>
            &nbsp;·&nbsp; Objetivo: <b>${fmt(odData?.T||oiData?.T||0,2,true)} D</b>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:${cols.length>1?'1fr 1fr':'1fr'};gap:0 18px;">
          ${cols.join('')}
        </div>
        <div style="font-size:6pt;color:#888;margin-top:4px;">
          ★ Fila resaltada = potencia recomendada para implantación &nbsp;·&nbsp;
          Verde: emetropía ±0.12D &nbsp;·&nbsp; Rojo: error &gt;0.62D &nbsp;·&nbsp;
          Factor vértice: ${vfPrim.toFixed(3)}
        </div>
      </div>`;
    }

      // Lente override: config > calculadora
      const reportBrand = cfgBrand || calc.iolBrand || '';
      const reportModel = cfgModel || calc.iolModel || '';
      // Override calc object brand/model for selectedIOLBlock
      const _origBrand = calc.iolBrand, _origModel = calc.iolModel;
      if (cfgBrand) calc.iolBrand = cfgBrand;
      if (cfgModel) calc.iolModel = cfgModel;

      // Eye order
      let eyeODData = odData, eyeOSData = oiData;
      let eyeODLabel = 'OD — Valores biométricos', eyeOSLabel = 'OS — Valores biométricos';
      let eyeODSpec = calc.specOD, eyeOSSpec = calc.specOS;
      if (cfgOIFirst) {
        [eyeODData, eyeOSData] = [oiData, odData];
        [eyeODLabel, eyeOSLabel] = ['OS — Valores biométricos','OD — Valores biométricos'];
        [eyeODSpec, eyeOSSpec]   = [calc.specOS, calc.specOD];
      }

      const result = `
    ${pageHeader('Por fórmula')}
    ${statusBar()}
    ${eyeSecHeader()}
    ${cfgSecBio ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px;margin-bottom:6px;
                padding-bottom:5px;border-bottom:0.5px solid #ccc;">
      <div><div style="font-size:7pt;font-weight:700;color:#444;margin-bottom:3px;">${eyeODLabel}</div>
        ${bioBlock(eyeODData, cfgOIFirst?'OS':'OD', eyeODSpec)}</div>
      <div><div style="font-size:7pt;font-weight:700;color:#444;margin-bottom:3px;">${eyeOSLabel}</div>
        ${bioBlock(eyeOSData, cfgOIFirst?'OD':'OS', eyeOSSpec)}</div>
    </div>` : ''}
    ${cfgSecObs && calc.patObs ? `<div style="font-size:7pt;color:#333;background:#f9f9f9;border-radius:4px;
        padding:3px 8px;margin-bottom:6px;border-left:2px solid #ccc;">
      <b>Observaciones:</b> ${calc.patObs}</div>` : ''}
    ${cfgSecIOLBlock ? selectedIOLBlock() : ''}
    ${cfgSecFormulas ? `
    <div style="display:flex;gap:16px;font-size:6.5pt;margin-bottom:4px;">
      <span><span style="display:inline-block;width:10px;height:10px;background:#e8f5e9;border:0.5px solid #ccc;vertical-align:middle;"></span> ${cfgOIFirst?'OS':'OD'} recomendada</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:#fce4ec;border:0.5px solid #ccc;vertical-align:middle;"></span> ${cfgOIFirst?'OD':'OS'} recomendada</span>
    </div>
    ${gridRows}` : ''}`;

      // Restore
      calc.iolBrand = _origBrand; calc.iolModel = _origModel;
      return result;
  }

  // ══════════════════════════════════════════════════════════
  // MODE B: BY IOL (comparison across manufacturers)
  // ══════════════════════════════════════════════════════════
  function buildLensMode() {
    const odData = calc.eyes?.OD, oiData = calc.eyes?.OI;
    const selectedBrand = calc.iolBrand || '';
    const selectedModel = calc.iolModel || '';

    // Gather all IOLs to compare — use all monofocal non-toric by default
    // If a specific IOL was selected, highlight it; show all others for comparison
    const allIOLs = [];
    Object.entries(IOL_DB).forEach(([brand, models]) => {
      Object.entries(models).forEach(([model, iol]) => {
        if (!iol.torico && iol.rango) {  // only spherical IOLs
          allIOLs.push({ brand, model, iol });
        }
      });
    });

    // Sort: selected first, then alphabetical by brand/model
    allIOLs.sort((a,b) => {
      if (a.model === selectedModel) return -1;
      if (b.model === selectedModel) return 1;
      return (a.brand+a.model).localeCompare(b.brand+b.model);
    });

    // For each IOL compute emme with its specific A-constant
    // Show: IOL name | Fórmula | OD IOL(D) | OD Res.SE | OS IOL(D) | OS Res.SE
    // Use the primary selected formula (Kane if available, else Barrett, else SRKT)
    const primaryFormulas = [
      { k:'Kane',    label:'Kane 2020', fn: calcKane },
      { k:'Barrett', label:'Barrett II', fn: calcBarrett },
      { k:'SRKT',    label:'SRK/T', fn: calcSRKT },
    ];

    function getEmmeForFormula(d, A, fnKey) {
      if (!d || !d.AL) return null;
      const dd = { ...d, A };
      if (fnKey==='Kane')    return calcKane(dd);
      if (fnKey==='Barrett') return calcBarrett(dd);
      if (fnKey==='SRKT')    return calcSRKT(dd);
      if (fnKey==='Haigis')  return calcHaigis(dd);
      if (fnKey==='HofferQ') return calcHofferQ(dd);
      return null;
    }

    // Use selected formulas or default to Kane+Barrett+SRKT
    const formulasToShow = primaryFormulas.filter(f => hasF(f.k)).slice(0,3);
    if (formulasToShow.length === 0) formulasToShow.push(...primaryFormulas.slice(0,2));

    // Build comparison table
    // Header spans: IOL info | Formula1 OD/OS | Formula2 OD/OS | Formula3 OD/OS
    let tableHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:7pt;">
      <thead>
        <tr style="background:#333;color:#fff;">
          <th style="padding:2px 5px;text-align:left;border:0.5px solid #555;" rowspan="2">LIO</th>
          <th style="padding:2px 5px;text-align:left;border:0.5px solid #555;" rowspan="2">Fabricante</th>
          <th style="padding:2px 5px;text-align:center;border:0.5px solid #555;" rowspan="2">Cte-A</th>`;

    formulasToShow.forEach(f => {
      tableHTML += `<th style="padding:2px 5px;text-align:center;border:0.5px solid #555;" colspan="4">${f.label}</th>`;
    });
    tableHTML += `</tr><tr style="background:#555;color:#fff;">`;
    formulasToShow.forEach(() => {
      tableHTML += `
        <th style="padding:1px 4px;text-align:right;border:0.5px solid #666;font-size:6pt;">OD IOL</th>
        <th style="padding:1px 4px;text-align:right;border:0.5px solid #666;font-size:6pt;">OD Res.</th>
        <th style="padding:1px 4px;text-align:right;border:0.5px solid #666;font-size:6pt;">OS IOL</th>
        <th style="padding:1px 4px;text-align:right;border:0.5px solid #666;font-size:6pt;">OS Res.</th>`;
    });
    tableHTML += `</tr></thead><tbody>`;

    allIOLs.forEach(({ brand, model, iol }) => {
      const isSelected = model === selectedModel;
      const rowBg = isSelected ? 'background:#e8f5e9;font-weight:700;' : '';
      tableHTML += `<tr style="${rowBg}border-bottom:0.5px solid #eee;">
        <td style="padding:2px 5px;border:0.5px solid #ddd;white-space:nowrap;">
          ${isSelected?'★ ':''}${model}
        </td>
        <td style="padding:2px 5px;border:0.5px solid #ddd;white-space:nowrap;font-size:6.5pt;color:#444;">${brand}</td>
        <td style="padding:2px 5px;border:0.5px solid #ddd;text-align:center;">${iol.A}</td>`;

      formulasToShow.forEach(f => {
        const emOD = getEmmeForFormula(odData, iol.A, f.k);
        const emOS = getEmmeForFormula(oiData, iol.A, f.k);
        const pOD  = emOD != null ? r2v(emOD) : null;
        const pOS  = emOS != null ? r2v(emOS) : null;
        const rxOD = emOD != null && pOD != null ? ((emOD-pOD)*vf + (odData?.T||0)) : null;
        const rxOS = emOS != null && pOS != null ? ((emOS-pOS)*vf + (oiData?.T||0)) : null;

        tableHTML += `
          <td style="padding:2px 4px;border:0.5px solid #ddd;text-align:right;font-weight:600;">
            ${pOD!=null?fmt(pOD,1,true):'---'}</td>
          <td style="padding:2px 4px;border:0.5px solid #ddd;text-align:right;color:${rxOD!=null&&Math.abs(rxOD)<0.25?'#27500A':'#333'};">
            ${rxOD!=null?fmt(rxOD,2,true):'---'}</td>
          <td style="padding:2px 4px;border:0.5px solid #ddd;text-align:right;font-weight:600;">
            ${pOS!=null?fmt(pOS,1,true):'---'}</td>
          <td style="padding:2px 4px;border:0.5px solid #ddd;text-align:right;color:${rxOS!=null&&Math.abs(rxOS)<0.25?'#27500A':'#333'};">
            ${rxOS!=null?fmt(rxOS,2,true):'---'}</td>`;
      });
      tableHTML += `</tr>`;
    });
    tableHTML += `</tbody></table>`;

    return `
    ${pageHeader('Por LIO — Comparativo entre fabricantes')}
    ${statusBar()}
    ${eyeSecHeader()}
    <!-- Biometry OD | OS -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 12px;margin-bottom:6px;
                padding-bottom:5px;border-bottom:0.5px solid #ccc;">
      <div>
        <div style="font-size:7pt;font-weight:700;color:#444;margin-bottom:3px;">OD — Valores biométricos</div>
        ${bioBlock(odData,'OD', calc.specOD)}
      </div>
      <div>
        <div style="font-size:7pt;font-weight:700;color:#444;margin-bottom:3px;">OS — Valores biométricos</div>
        ${bioBlock(oiData,'OS', calc.specOS)}
      </div>
    </div>
    <!-- Legend -->
    <div style="display:flex;gap:16px;font-size:6.5pt;margin-bottom:5px;">
      <span>★ LIO seleccionado</span>
      <span style="color:#27500A;">● Res.SE verde = dentro de ±0.25D del objetivo</span>
      <span>IOL (D) = potencia redondeada a 0.5D implantable &nbsp;·&nbsp; Res.SE = refracción estimada</span>
    </div>
    ${tableHTML}`;
  }

  // ── BUILD & PRINT ─────────────────────────────────────────
  // Si secCompare está activo, incluimos ambas secciones; si no, solo fórmulas
  let body = '';
  if (cfgSecCompare && !cfgSecFormulas) {
    body = buildLensMode();
  } else if (cfgSecCompare && cfgSecFormulas) {
    body = buildFormulaMode() + '<div style="page-break-before:always;"></div>' + buildLensMode();
  } else {
    body = buildFormulaMode();
  }

  // ── Helper para bloque de microscopía especular ─────────────
  function specBlock(spec, eyeLabel) {
    if (!spec || (!spec.CD && !spec.CV && !spec.A6 && !spec.CCT_esp)) return '';
    const cdColor = spec.CD != null
      ? (spec.CD < 1000 ? '#993C1D' : spec.CD < 1500 ? '#993C1D' : spec.CD < 2000 ? '#633806' : '#27500A')
      : '#333';
    const items = [
      spec.CD  != null ? `CD: <b style="color:${cdColor}">${spec.CD} cél/mm²</b>` : '',
      spec.CV  != null ? `CV: <b>${spec.CV}%</b>` : '',
      spec.A6  != null ? `6A: <b>${spec.A6}%</b>` : '',
      spec.CCT_esp != null ? `CCT: <b>${spec.CCT_esp} µm</b>` : '',
    ].filter(Boolean).join(' &nbsp;·&nbsp; ');
    // Evaluación global
    let riesgo = 0;
    if (spec.CD  != null && spec.CD  < 1000) riesgo = 3;
    else if (spec.CD != null && spec.CD < 1500) riesgo = Math.max(riesgo, 2);
    else if (spec.CD != null && spec.CD < 2000) riesgo = Math.max(riesgo, 1);
    if (spec.CV  != null && spec.CV  > 40) riesgo = Math.max(riesgo, 2);
    else if (spec.CV != null && spec.CV > 33) riesgo = Math.max(riesgo, 1);
    if (spec.A6  != null && spec.A6  < 40) riesgo = Math.max(riesgo, 2);
    else if (spec.A6 != null && spec.A6 < 60) riesgo = Math.max(riesgo, 1);
    const evalLabels = ['Apto', 'Riesgo moderado', 'Riesgo alto', 'Contraindicación relativa'];
    const evalColors = ['#27500A', '#633806', '#993C1D', '#993C1D'];
    const evalBgs    = ['#EAF3DE', '#FAEEDA', '#FDECEA', '#FDECEA'];
    return `<div style="margin-bottom:4px;">
      <div style="font-size:6.5pt;font-weight:700;color:#444;margin-bottom:2px;">
        <i>Microscopía especular — ${eyeLabel}</i>
      </div>
      <div style="background:${evalBgs[riesgo]};border-radius:4px;padding:3px 7px;font-size:7pt;color:${evalColors[riesgo]};">
        <b>${evalLabels[riesgo]}</b> &nbsp;·&nbsp; ${items}
      </div>
    </div>`;
  }

  const hasSpecOD = calc.specOD && Object.values(calc.specOD).some(v => v != null);
  const hasSpecOS = calc.specOS && Object.values(calc.specOS).some(v => v != null);
  const hasObs    = calc.patObs && calc.patObs.trim().length > 0;

  const footer = `
  <!-- ══ MICROSCOPÍA + OBSERVACIONES ══════════════════════ -->
  ${(hasSpecOD || hasSpecOS) ? `
  <div style="margin-top:10px;border-top:1px solid #ccc;padding-top:7px;">
    <div style="font-size:7pt;font-weight:700;text-transform:uppercase;color:#555;
                letter-spacing:.4px;margin-bottom:5px;">
      Microscopía especular
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;">
      <div>${specBlock(calc.specOD, 'OD derecho')}</div>
      <div>${specBlock(calc.specOS, 'OS izquierdo')}</div>
    </div>
  </div>` : ''}

  <!-- ══ OBSERVACIONES + FIRMA ══════════════════════════════ -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;
              margin-top:8px;border-top:1px solid #ccc;padding-top:7px;">
    <div style="border:1px solid #bbb;border-radius:5px;min-height:52px;
                padding:6px 9px;font-size:7.5pt;color:#222;line-height:1.5;">
      <div style="font-size:6.5pt;font-weight:700;color:#555;margin-bottom:3px;
                  text-transform:uppercase;letter-spacing:.4px;">Observaciones</div>
      ${hasObs ? calc.patObs : '<span style="color:#aaa;">—</span>'}
    </div>
    <div style="border:1px solid #bbb;border-radius:5px;min-height:52px;
                padding:6px 9px;font-size:7.5pt;color:#888;">
      <div style="font-size:6.5pt;font-weight:700;color:#555;margin-bottom:3px;
                  text-transform:uppercase;letter-spacing:.4px;">Firma y sello del médico</div>
    </div>
  </div>

  <!-- ══ FOOTER ════════════════════════════════════════════ -->
  <div style="text-align:center;font-size:6.5pt;color:#999;margin-top:6px;
              border-top:1px solid #eee;padding-top:4px;">
    LIOmetría v2.2 &nbsp;·&nbsp; Resultados orientativos.
    La responsabilidad clínica es exclusiva del médico tratante.
    &nbsp;·&nbsp; ${dateStr} ${timeStr}
  </div>`;

  // ── Nombre de archivo inteligente ─────────────────────────────
  // Formato: LIOmetria_YYYYMMDD_HHMMSS_NombreApellido_HC_OD|OI|OU
  function buildFilename() {
    // Fecha/hora compacta
    const pad  = n => String(n).padStart(2,'0');
    const ts   = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    // Nombre del paciente — normalizado (sin tildes, sin espacios especiales)
    const normalize = s => (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-zA-Z0-9]/g,'').substring(0,24);
    const patRaw  = (calc.patName||'Paciente').trim();
    const patNorm = normalize(patRaw) || 'Paciente';
    // HC / cédula
    const hcRaw  = (calc.patHC||'').trim();
    const hcNorm = hcRaw ? normalize(hcRaw).substring(0,12) : '';
    // Ojos calculados
    const eyes = calc.eyes || {};
    const hasOD = !!(eyes.OD?.AL), hasOI = !!(eyes.OI?.AL);
    const eyeStr = hasOD && hasOI ? 'OU' : hasOD ? 'OD' : 'OI';
    // Ensamblar
    const parts = ['LIOmetria', ts, patNorm, hcNorm, eyeStr].filter(Boolean);
    return parts.join('_');
  }
  const filename = buildFilename();

  const win = window.open('', '_blank', 'width=860,height=1100');
  win.document.write(`<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8">
    <title>${filename}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{background:#fff;font-family:Arial,Helvetica,sans-serif;font-size:8pt;color:#000;padding:8mm 10mm;}
      @media print{@page{margin:5mm;size:A4 portrait;}body{padding:0;}}
    </style>
  </head><body>
    ${body}
    ${footer}
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(()=>{ win.print(); }, 500);
}



/* ============================================================
   LIMPIAR
   ============================================================ */
function clearAll() {
  ['OD','OI'].forEach(e => ['AL','K1','K2','Kaxis','ACD','LT','CCT','WTW','A','T'].forEach(f => { const el = document.getElementById(e+'_'+f); if(el) el.value=''; }));
  ['patName','patDOB','patHC','toricCyl','toricCylAxis','toricACP','SIA_mag','SIA_axis',
   'preRxSph','preK1','preK2','yrsSurg','Kmax','Kmin','kcPachy','rkOZ','rkYears','rkRxAM','rkRxPM','rkDiurnal'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  document.getElementById('resultsArea').innerHTML = '';
}

/* ============================================================
   EVENTOS
   ============================================================ */
document.getElementById('rkRxAM')?.addEventListener('input', () => {
  const am = gn('rkRxAM')||0, pm = gn('rkRxPM')||0;
  const el = document.getElementById('rkDiurnal'); if(el) el.value = Math.abs(pm-am).toFixed(2);
});
document.getElementById('rkRxPM')?.addEventListener('input', () => {
  const am = gn('rkRxAM')||0, pm = gn('rkRxPM')||0;
  const el = document.getElementById('rkDiurnal'); if(el) el.value = Math.abs(pm-am).toFixed(2);
});

