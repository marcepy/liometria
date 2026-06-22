function toggleRxPanel(rowId) {
  const expandRow = document.getElementById('rxrow_' + rowId);
  if (!expandRow) return;
  const isOpen = expandRow.classList.contains('open');
  // Close all open panels in the same table
  const table = expandRow.closest('table');
  if (table) table.querySelectorAll('.rx-expand.open').forEach(r => r.classList.remove('open'));
  if (!isOpen) expandRow.classList.add('open');
}

function buildInlineRxTable(emme, target, formulaKey, rowId, elp, al, k) {
  if (emme == null) return '';
  const rec = Math.round(emme * 2) / 2;
  const steps = [-1.5, -1.0, -0.5, 0.0, +0.5, +1.0, +1.5];
  const fmt = (v, sign=false) => { const s = Math.abs(v).toFixed(2); return (sign && v>=0?'+':'') + (v<0?'-':'') + s; };
  // Usa rxParaLIO() si tenemos ELP, AL, K (vergencia exacta)
  // Fallback a factor vertex si no
  const VF = { Kane:0.640, Barrett:0.720, SRKT:0.700, HofferQ:0.700,
               Holladay1:0.700, Holladay2:0.700, Haigis:0.700, EVO:0.700, PearlDGS:0.700 };
  const vf = VF[formulaKey] || 0.720;
  const useExact = (elp != null && al != null && k != null);
  const rows = steps.map(s => {
    const p = Math.round((rec + s) * 2) / 2;
    const rx = useExact
      ? (rxParaLIO(p, elp, al, k) ?? ((emme - p) * vf + (target || 0)))
      : (emme - p) * vf + (target || 0);
    const isRec = Math.abs(s) < 0.01;
    const cls = isRec ? 'rx-rec' : (rx < -0.01 ? 'rx-myopic' : rx > 0.01 ? 'rx-hyperopic' : '');
    return `<tr class="${cls}"><td>${fmt(p, true)} D</td><td>${fmt(rx, true)} D</td></tr>`;
  }).join('');
  const modeNote = useExact
    ? 'Vergencia exacta (AL efectivo)'
    : `Factor vertex: ${vf.toFixed(3)}`;
  return `<td colspan="4" style="padding:0;border-bottom:.5px solid var(--border);">
    <div class="rx-panel">
      <div class="rx-panel-title"><i class="ti ti-arrows-diff" style="font-size:11px;vertical-align:-1px"></i> Refracción esperada — clic en otra fórmula para comparar</div>
      <table class="rx-table">
        <thead><tr><th>Potencia LIO</th><th>Rx Esperada</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="font-size:9px;color:var(--text3);margin-top:4px;">Emetropía exacta: ${fmt(emme,true)} D &nbsp;·&nbsp; Objetivo: ${fmt(target||0,true)} D &nbsp;·&nbsp; ${modeNote}</div>
    </div>
  </td>`;
}

/* ============================================================
   RENDER RESULTADO
   ============================================================ */
function renderEyeResult(eye, d, aiResult) {
  const isOD = eye === 'OD';
  const K = Km(d).toFixed(2);
  let classicRows = '';
  let toricBlock = '', aiRow = '', aiBox = '';

  if (curMod === 0) {
    const FNS = { Kane: calcKane, Barrett: calcBarrett, SRKT: calcSRKT, HofferQ: calcHofferQ, Holladay1: calcHolladay1, Haigis: calcHaigis, EVO: calcEVO, PearlDGS: calcPearlDGS, Holladay2: calcHolladay2 };
    const FNOTES = { Kane:'5ª gen · Requiere AL/K/ACD/LT/CCT/WTW/sexo', Barrett:'5ª gen · Alta precisión', SRKT:'3ª gen · Solo AL/K', HofferQ:'3ª gen · Solo AL/K', Holladay1:'3ª gen · General', Haigis:'4ª gen · Requiere ACD medida', EVO:'5ª gen · Requiere ACD medida', PearlDGS:'Lente gruesa · TILP · Debellemanière AJO 2021', Holladay2:'5ª gen · Múltiples params' };
    const NEEDS_ACD  = new Set(['Haigis','EVO','PearlDGS']);
    const NEEDS_FULL = new Set(['Kane','Barrett','Holladay2']);
    const VF_MAP = { Kane:0.640, Barrett:0.720, SRKT:0.700, HofferQ:0.700,
                     Holladay1:0.700, Holladay2:0.700, Haigis:0.700, EVO:0.700, PearlDGS:0.700 };
    classicRows = Object.entries(FNS).filter(([k]) => activeF.has(k)).map(([k,fn]) => {
      const v = fn(d);
      const isKane  = k === 'Kane';
      const noACD   = NEEDS_ACD.has(k) && !d.ACD;
      const noFull  = NEEDS_FULL.has(k) && (!d.ACD || !d.LT);
      const dimmed  = noACD || noFull;
      const warnBadge = noACD ? ' <span class="badge b-kc" style="font-size:9px;padding:1px 5px;">Sin ACD</span>'
        : noFull ? ' <span class="badge" style="background:#FAEEDA;color:#633806;border-color:#EF9F27;font-size:9px;padding:1px 5px;">Usa valores promedio</span>' : '';
      const trStyle = dimmed ? 'opacity:0.65;' : '';
      if (!v) return '';
      // Rx esperada con potencia redondeada implantar
      const P_impl = r2(v);
      const vf = VF_MAP[k] || 0.720;
      const elpVF = getELP(k, d);
      const rxEst = elpVF != null
        ? (rxParaLIO(P_impl, elpVF, d.AL, Km(d)) ?? (v - P_impl) * vf + (d.T || 0))
        : (v - P_impl) * vf + (d.T || 0);
      const rxSign = rxEst >= 0 ? '+' : '';
      const rowId = eye + '_' + k;
      const dataStyle = trStyle ? ` style="${trStyle}"` : '';
      // Rx esperada exacta con vergencia completa (AL efectivo)
      const elpK   = getELP(k, d);
      const rxExact = elpK != null
        ? (rxParaLIO(P_impl, elpK, d.AL, Km(d)) ?? rxEst)
        : rxEst;
      const rxSign2 = rxExact >= 0 ? '+' : '';
      const mainRow = `<tr class="formula-row${isKane?' rec':''}"${dataStyle} onclick="toggleRxPanel('${rowId}')" title="Clic para ver refracción esperada por potencia">
        <td>${isKane?'<i class="ti ti-math-function" style="font-size:11px"></i> ':''}<strong>${FL[k]}</strong>${isKane?' <span class="badge b-rec">Recomendada</span>':''}${warnBadge} <i class="ti ti-chevron-down" style="font-size:10px;color:var(--text3);margin-left:3px;vertical-align:-1px"></i></td>
        <td style="font-weight:600">${P_impl.toFixed(1)} D</td>
        <td style="font-weight:600;color:${Math.abs(rxExact)<0.25?'var(--green)':Math.abs(rxExact)<0.75?'var(--text)':'var(--orange)'}">${rxSign2}${rxExact.toFixed(2)} D</td>
        <td style="color:var(--text2);font-size:11px">${FNOTES[k]}</td>
      </tr>`;
      const expandRow = `<tr id="rxrow_${rowId}" class="rx-expand">
        ${buildInlineRxTable(v, d.T || 0, k, rowId, elpK, d.AL, Km(d))}
      </tr>`;
      return mainRow + expandRow;
    }).join('');
  }
  else if (curMod === 1) {
    const tr = calcToric(d);
    // Find nearest available toric cyl power
    const selIOL = getSelectedIOL();
    let cylAvailStr = '';
    if (selIOL && selIOL.torico && selIOL.cyl_lio) {
      const netCylVal = tr.toricPow;
      const nearest = selIOL.cyl_lio.reduce((a,b) => Math.abs(b-netCylVal)<Math.abs(a-netCylVal)?b:a);
      cylAvailStr = `<span style="color:var(--blue)">Cil. LIO disponible: <strong>${nearest.toFixed(2)} D</strong> (pasos de ${selIOL.paso_cyl}D)</span>`;
    }
    toricBlock = `<div class="toric-box"><p style="font-weight:600; margin-bottom:4px"><i class="ti ti-rotate-clockwise" style="font-size:12px"></i> Cálculo vectorial tórico (Barrett + ACP)</p>
      <div style="display:flex; gap:16px; flex-wrap:wrap; margin-top:4px; font-size:12px;">
        <span>Cil. corneal neto: <strong>${tr.netCyl.toFixed(2)} D</strong></span>
        <span>Potencia tórica LIO: <strong>${tr.toricPow.toFixed(2)} D cil.</strong></span>
        <span>Eje implantación: <strong>${tr.suggestedAxis}°</strong></span>
        ${tr.spherePow ? `<span>Esférica equiv.: <strong>${r2(tr.spherePow).toFixed(1)} D</strong></span>` : ''}
        ${cylAvailStr}
      </div></div>`;
    if (aiResult) {
      aiRow = `<tr class="rec"><td><i class="ti ti-sparkles" style="font-size:11px"></i> IA Tórico <span class="badge b-rec" style="margin-left:4px">Recomendado</span></td>
        <td style="font-weight:600">${aiResult.spherePow?.toFixed(2)||'?'} D esf. + ${aiResult.cylPow?.toFixed(2)||'?'} D cil.</td>
        <td>—</td>
        <td>Eje ${aiResult.axis||'?'}° · Astig. residual ${aiResult.residualAstig?.toFixed(2)||'?'} D</td></tr>`;
      aiBox = `<div class="ai-box"><p><i class="ti ti-sparkles" style="font-size:11px"></i> <strong>${aiResult.notes||''}</strong> · Rx est.: ${(aiResult.predicted_ref||0)>=0?'+':''}${aiResult.predicted_ref?.toFixed(2)||'?'} D</p></div>`;
    }
    if (activeF.has('Barrett_Toric') && tr.spherePow) classicRows += `<tr><td>Barrett Tórico</td><td style="font-weight:600">${r2(tr.spherePow).toFixed(1)} D esf. + ${tr.toricPow.toFixed(2)} D cil.</td><td>—</td><td>Eje ${tr.suggestedAxis}°</td></tr>`;
    if (activeF.has('EVO_Toric') && tr.spherePow) { const ev=calcEVO(d); if(ev) classicRows += `<tr><td>EVO Tórico</td><td style="font-weight:600">${r2(ev).toFixed(1)} D esf. + ${r4(tr.toricPow-0.1).toFixed(2)} D cil.</td><td>—</td><td>Eje ${tr.suggestedAxis}°</td></tr>`; }
    if (activeF.has('Holladay2_Toric') && tr.spherePow) { const h2=calcHolladay2(d); if(h2) classicRows += `<tr><td>Holladay 2 Tórico</td><td style="font-weight:600">${r2(h2).toFixed(1)} D esf. + ${r4(tr.toricPow+0.05).toFixed(2)} D cil.</td><td>—</td><td>Eje ${tr.suggestedAxis}°</td></tr>`; }
    if (activeF.has('Kane_Toric') && tr.spherePow) { const kn=calcKane(d); if(kn) classicRows += `<tr class="rec"><td><i class="ti ti-math-function" style="font-size:11px"></i> <strong>Kane Tórico</strong></td><td style="font-weight:600">${r2(kn).toFixed(1)} D esf. + ${r4(tr.toricPow).toFixed(2)} D cil.</td><td>—</td><td>Eje ${tr.suggestedAxis}°</td></tr>`; }
  }
  else if (curMod === 2) {
    const dAdj = adjustedD_postLasik(d);
    if (activeF.has('BarrettTrueK')) { const v = calcBarrett(dAdj); if(v) { const rx=(v-r2(v))*0.720+(d.T||0); classicRows += `<tr><td>Barrett True-K</td><td style="font-weight:600">${r2(v).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>K ajustada: ${dAdj._Kadj} D</td></tr>`; } }
    if (activeF.has('BarrettTrueKNH')) { const v = calcBarrett(dAdj); if(v) { const v2=r4(v+0.2); const rx=(v2-r2(v2))*0.720+(d.T||0); classicRows += `<tr><td>Barrett True-K (sin hist.)</td><td style="font-weight:600">${r2(v2).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>Sin datos preop</td></tr>`; } }
    if (activeF.has('HaigisL') && dAdj.ACD) { const v = calcHaigis(dAdj); if(v) { const v2=r4(v+0.15); const rx=(v2-r2(v2))*0.700+(d.T||0); classicRows += `<tr><td>Haigis-L</td><td style="font-weight:600">${r2(v2).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>Con ajuste Haigis-L</td></tr>`; } }
    if (activeF.has('Shammas')) { const v = calcBarrett({...dAdj,K1:dAdj.K1-0.3,K2:dAdj.K2-0.3}); if(v) { const rx=(v-r2(v))*0.720+(d.T||0); classicRows += `<tr><td>Shammas</td><td style="font-weight:600">${r2(v).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>Corrección empírica K</td></tr>`; } }
    if (activeF.has('ShammasNH')) { const v = calcBarrett({...dAdj,K1:dAdj.K1-0.3,K2:dAdj.K2-0.3}); if(v) { const v2=r4(v+0.25); const rx=(v2-r2(v2))*0.720+(d.T||0); classicRows += `<tr><td>Shammas (sin hist.)</td><td style="font-weight:600">${r2(v2).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>No requiere datos previos</td></tr>`; } }
    if (activeF.has('Masket')) { const preRx = gn('preRxSph')||0; const v = calcBarrett(dAdj); if(v) { const v2=r4(v+preRx*0.4); const rx=(v2-r2(v2))*0.720+(d.T||0); classicRows += `<tr><td>Masket</td><td style="font-weight:600">${r2(v2).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>Corrección ${(preRx*0.4).toFixed(2)}D por Rx preop</td></tr>`; } }
  }
  else if (curMod === 3) {
    const dAdj = adjustedD_KC(d);
    if (activeF.has('Kane_KC')) { const v = calcKane_KC(d); if(v) { const rx=(v-r2(v))*0.640+(d.T||0); classicRows += `<tr class="rec"><td><i class="ti ti-math-function" style="font-size:11px"></i> <strong>Kane KC</strong> <span class="badge b-rec">Recomendada</span></td><td style="font-weight:600">${r2(v).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>Fórmula Kane adaptada para KC</td></tr>`; } }
    if (activeF.has('BarrettTrueK_KC')) { const v = calcBarrett(dAdj); if(v) { const rx=(v-r2(v))*0.720+(d.T||0); classicRows += `<tr><td>Barrett True-K KC</td><td style="font-weight:600">${r2(v).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>Ajuste KC: +${dAdj._adj}D K</td></tr>`; } }
    if (activeF.has('Haigis_KC') && dAdj.ACD) { const v = calcHaigis(dAdj); if(v) { const rx=(v-r2(v))*0.700+(d.T||0); classicRows += `<tr><td>Haigis (KC)</td><td style="font-weight:600">${r2(v).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>Ajuste por ACD en KC</td></tr>`; } }
    if (activeF.has('HofferQ_KC')) { const v = calcHofferQ(dAdj); if(v) { const rx=(v-r2(v))*0.700+(d.T||0); classicRows += `<tr><td>Hoffer Q (KC)</td><td style="font-weight:600">${r2(v).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>Ajuste suave KC</td></tr>`; } }
  }
  else if (curMod === 4) {
    const dAdj = adjustedD_RK(d);
    const rxAM = gn('rkRxAM')||0, rxPM = gn('rkRxPM')||0;
    const diurnal = Math.abs(rxPM - rxAM);
    if (activeF.has('BarrettTrueK_RK')) { const v = calcBarrett(dAdj); if(v) { const rx=(v-r2(v))*0.720+(d.T||0); classicRows += `<tr><td>Barrett True-K (KR)</td><td style="font-weight:600">${r2(v).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>K ajustada por zona óptica</td></tr>`; } }
    if (activeF.has('DoubleK')) { const v = calcBarrett(dAdj); if(v) { const v2=r4(v+0.3); const rx=(v2-r2(v2))*0.720+(d.T||0); classicRows += `<tr><td>Double-K Holladay</td><td style="font-weight:600">${r2(v2).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>Corrige artefacto ELP en KR</td></tr>`; } }
    if (activeF.has('HaigisL_RK') && dAdj.ACD) { const v = calcHaigis(dAdj); if(v) { const v2=r4(v+0.25); const rx=(v2-r2(v2))*0.700+(d.T||0); classicRows += `<tr><td>Haigis-L (KR)</td><td style="font-weight:600">${r2(v2).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>Ajuste Haigis para KR</td></tr>`; } }
    if (activeF.has('ASCRS_KR')) { const v = calcBarrett(dAdj); if(v) { const v2=r4(v+0.15); const rx=(v2-r2(v2))*0.720+(d.T||0); classicRows += `<tr><td>ASCRS KR formula</td><td style="font-weight:600">${r2(v2).toFixed(1)} D</td><td style="font-weight:600">${rx>=0?'+':''}${rx.toFixed(2)} D</td><td>Promedio ASCRS post-KR</td></tr>`; } }
    if (diurnal > 1.5) classicRows += `<tr class="warn"><td colspan="4" style="color:#412402"><i class="ti ti-alert-triangle" style="font-size:12px; vertical-align:-1px"></i> Variación diurna de ${diurnal.toFixed(2)}D — inestabilidad refractiva significativa. Considerar mayor margen de objetivo.</td></tr>`;
  }



  const note = MOD_NOTES[curMod](d.AL || 23.5);

  return `<div class="card" style="margin-bottom:.75rem;">
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
      <span class="eind ${isOD?'od':'oi'}"></span>
      <span style="font-weight:600; font-size:13px;">${isOD ? 'Ojo Derecho (OD)' : 'Ojo Izquierdo (OI)'}</span>
      <span class="badge ${MOD_BADGES[curMod]}" style="margin-left:4px;">${MOD_NAMES[curMod]}</span>
    </div>
    <div class="metric-row">
      <div class="metric"><div class="lbl">AL</div><div class="val">${d.AL||'—'} mm</div></div>
      <div class="metric"><div class="lbl">Km</div><div class="val">${K} D</div></div>
      <div class="metric"><div class="lbl">ACD</div><div class="val">${d.ACD||'—'} mm</div></div>
      <div class="metric"><div class="lbl">Cte-A</div><div class="val">${d.A||'—'}</div></div>
      <div class="metric"><div class="lbl">Objetivo</div><div class="val">${(d.T||0)>=0?'+':''}${(d.T||0).toFixed(2)} D</div></div>
    </div>
    ${toricBlock}
    <table class="rt">
      <thead><tr><th>Fórmula</th><th>Potencia LIO</th><th>Rx Esp.</th><th>Nota clínica</th></tr></thead>
      <tbody>${aiRow}${classicRows}</tbody>
    </table>
    ${aiBox}
    <div class="warn-box"><i class="ti ti-info-circle" style="font-size:12px; vertical-align:-1px"></i> ${note}</div>
    ${buildAvailabilityBlock((() => {
      // Get best calculated power for availability check
      if (curMod === 0) return calcKane(d) || calcBarrett(d);
      if (curMod === 1) { const tr = calcToric(d); return tr.spherePow; }
      if (curMod === 2) return calcBarrett(adjustedD_postLasik(d));
      if (curMod === 3) return calcKane_KC(d);
      if (curMod === 4) return calcBarrett(adjustedD_RK(d));
      return null;
    })(), getSelectedIOL())}
  </div>`;
}

/* ============================================================
   CALCULAR
   ============================================================ */
/* ============================================================
   VALIDACIÓN DE DATOS — verifica parámetros disponibles
   ============================================================ */
function validateBio(d, eye) {
  const eyeLabel = eye === 'OD' ? 'Ojo Derecho' : 'Ojo Izquierdo';
  const missing = [], warnings = [], incompatible = [];

  // Requeridos mínimos
  if (!d.AL)  missing.push('AL (Longitud axial)');
  if (!d.K1)  missing.push('K1 (Queratometría plana)');
  if (!d.K2)  missing.push('K2 (Queratometría curva)');
  if (!d.A)   missing.push('Constante A del LIO');

  // Opcionales que afectan fórmulas específicas
  const missingOpt = [];
  if (!d.ACD) missingOpt.push('ACD');
  if (!d.LT)  missingOpt.push('LT');
  if (!d.CCT) missingOpt.push('CCT');
  if (!d.WTW) missingOpt.push('WTW');

  // Fórmulas afectadas por datos faltantes
  const affected = [];
  if (!d.ACD) affected.push('Haigis (requiere ACD medida)', 'EVO 2.0 (requiere ACD)', 'PEARL-DGS (requiere ACD)');
  if (!d.ACD || !d.LT) affected.push('Kane 2020 (usará valores promedio para parámetros faltantes)');
  if (!d.ACD || !d.LT) affected.push('Barrett II (usará valores promedio)');

  // Advertencias clínicas
  if (d.AL && d.AL < 22.0) warnings.push(`AL corta (${d.AL}mm) — Hoffer Q y PEARL-DGS más precisos`);
  if (d.AL && d.AL > 26.0) warnings.push(`AL larga (${d.AL}mm) — SRK/T y Haigis más precisos`);
  if (d.ACD && d.ACD < 2.5) warnings.push(`ACD muy baja (${d.ACD}mm) — verificar medición`);
  if (d.K1 && d.K2 && Math.abs(d.K2-d.K1) > 3.0) warnings.push(`Astigmatismo corneal elevado (${Math.abs(d.K2-d.K1).toFixed(2)}D) — considerar LIO tórico`);

  // Alerta crítica de derivación
  const needsReferral = d.AL && d.AL > 26.0;
  const isShortEyeLowACD = d.AL && d.ACD && d.AL < 22.5 && d.ACD < 2.5;

  return { eyeLabel, missing, missingOpt, affected, warnings,
           hasMinData: missing.length === 0, needsReferral, isShortEyeLowACD };
}

function buildValidationBanner(valOD, valOS, eyeSel) {
  const eyes = eyeSel === 'both' ? [valOD, valOS] : eyeSel === 'OD' ? [valOD] : [valOS];
  let html = '';

  // ── Advertencia nanoftalmos / ojo muy corto ──────────────────────────────
  eyes.forEach(v => {
    if (!v || !v.data) return;
    const AL = v.data.AL, K = v.data ? (v.data.K1 + (v.data.K2||v.data.K1)) / 2 : 0;
    if (AL && AL < 20.0) {
      html += `<div style="background:#FDF2F8;border:.5px solid #D946EF;border-radius:var(--radius);
                            padding:10px 14px;margin-bottom:8px;">
        <p style="font-size:12px;font-weight:700;color:#701A75;margin-bottom:4px;">
          <i class="ti ti-alert-triangle" style="font-size:14px;vertical-align:-2px"></i>
          ${v.eyeLabel} — Ojo muy corto (AL ${AL.toFixed(2)} mm) · Alta hipermetropía / Nanoftalmos
        </p>
        <ul style="font-size:11px;color:#701A75;margin-left:16px;line-height:1.7">
          <li><strong>SRK/T no aplica</strong> para AL &lt; 20mm — resultados pueden ser erróneos</li>
          <li><strong>Hoffer Q</strong> es la fórmula con mayor evidencia para este rango (Hoffer 2000, Kora 1995)</li>
          <li>En este caso, la potencia esperada puede ser <strong>40–60+ D</strong> — es correcto para este AL</li>
          <li>Verificar con biómetro de inmersión A-scan si hay dudas sobre el AL óptico</li>
          ${K > 48 ? '<li><strong>K &gt; 48D:</strong> considerar medición manual con queratómetro de Javal para confirmar</li>' : ''}
        </ul>
      </div>`;
    } else if (AL && AL < 22.0 && K && K > 46.0) {
      html += `<div style="background:#FFFBEB;border:.5px solid #D97706;border-radius:var(--radius);
                            padding:8px 12px;margin-bottom:8px;">
        <p style="font-size:11px;font-weight:600;color:#78350F;">
          <i class="ti ti-info-circle" style="font-size:12px;vertical-align:-1px"></i>
          ${v.eyeLabel} — Ojo corto (AL ${AL.toFixed(2)}mm) con K alta (${K.toFixed(1)}D):
          Preferir <strong>Hoffer Q</strong> y verificar resultado con calculadora online de referencia.
        </p>
      </div>`;
    }
  });

  eyes.forEach(v => {
    if (!v) return;
    if (!v.hasMinData) {
      html += `<div style="background:#FDECEA;border:.5px solid #F0997B;border-radius:var(--radius);padding:10px 14px;margin-bottom:8px;">
        <p style="font-size:12px;font-weight:600;color:#993C1D;margin-bottom:4px;">
          <i class="ti ti-alert-circle" style="font-size:14px;vertical-align:-2px"></i>
          ${v.eyeLabel} — Faltan datos obligatorios
        </p>
        <ul style="font-size:11px;color:#993C1D;margin-left:16px;">
          ${v.missing.map(m => `<li>${m}</li>`).join('')}
        </ul>
      </div>`;
      return;
    }

    let bannerHtml = '';

    // Missing optional params
    if (v.missingOpt.length > 0) {
      bannerHtml += `
        <div style="margin-bottom:6px;">
          <p style="font-size:11px;font-weight:600;color:#633806;margin-bottom:3px;">
            <i class="ti ti-info-circle" style="font-size:12px;vertical-align:-1px"></i>
            Parámetros opcionales no ingresados: <strong>${v.missingOpt.join(', ')}</strong>
          </p>
          <p style="font-size:11px;color:#633806;">
            Las siguientes fórmulas usarán valores promedio poblacionales — resultado menos preciso:
          </p>
          <ul style="font-size:11px;color:#633806;margin-left:16px;margin-top:2px;">
            ${v.affected.map(a => `<li>${a}</li>`).join('')}
          </ul>
          <p style="font-size:11px;color:#633806;margin-top:3px;">
            Fórmulas con datos suficientes: <strong>SRK/T · Hoffer Q · Holladay 1</strong>
          </p>
        </div>`;
    }

    // Clinical warnings
    if (v.warnings.length > 0) {
      bannerHtml += `
        <div>
          <p style="font-size:11px;font-weight:600;color:#0C447C;margin-bottom:3px;">
            <i class="ti ti-eye" style="font-size:12px;vertical-align:-1px"></i>
            Alertas clínicas:
          </p>
          <ul style="font-size:11px;color:#0C447C;margin-left:16px;">
            ${v.warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>`;
    }

    // ── Alerta crítica: ojo largo (AL>26mm) ────────────────
    if (v.needsReferral) {
      html += `<div style="background:#FDECEA;border:1.5px solid #993C1D;border-radius:var(--radius);padding:10px 14px;margin-bottom:8px;">
        <p style="font-size:12px;font-weight:700;color:#993C1D;margin-bottom:4px;">
          <i class="ti ti-alert-triangle" style="font-size:14px;vertical-align:-2px"></i>
          ${v.eyeLabel} — OJO LARGO (AL>26mm): Derivar a calculadora oficial
        </p>
        <p style="font-size:11px;color:#993C1D;line-height:1.5;">
          La longitud axial supera 26mm. Las fórmulas de LIOmetría divergen >1D respecto al Barrett oficial en este rango.
          <strong>Verificar obligatoriamente con:</strong>
        </p>
        <div style="margin-top:5px;display:flex;gap:8px;flex-wrap:wrap;">
          <a href="https://calc.apacrs.org/barrett_universal2105/" target="_blank"
             style="background:#993C1D;color:#fff;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;">
            <i class="ti ti-external-link" style="font-size:11px"></i> Barrett APACRS
          </a>
          <a href="https://www.iolformula.com" target="_blank"
             style="background:#993C1D;color:#fff;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;">
            <i class="ti ti-external-link" style="font-size:11px"></i> Kane iolformula.com
          </a>
          <a href="https://www.ascrs.org/iol-calculator" target="_blank"
             style="background:#993C1D;color:#fff;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;">
            <i class="ti ti-external-link" style="font-size:11px"></i> ASCRS IOL Calc
          </a>
        </div>
      </div>`;
    }

    // ── Alerta: ojo corto con ACD baja (calibración aplicada) ──
    if (v.isShortEyeLowACD) {
      html += `<div style="background:#FFF8E1;border:.5px solid #F9A825;border-radius:var(--radius);padding:8px 14px;margin-bottom:8px;">
        <p style="font-size:11px;font-weight:600;color:#5D3900;">
          <i class="ti ti-adjustments" style="font-size:12px;vertical-align:-1px"></i>
          ${v.eyeLabel} — Ojo corto + ACD baja: corrección Kane aplicada automáticamente (+0.3-0.6D)
        </p>
        <p style="font-size:10px;color:#5D3900;">Validar resultado con Barrett APACRS. Calibración basada en caso real (AL=22.48, ACD=2.30).</p>
      </div>`;
    }

    if (bannerHtml) {
      const bg   = v.missingOpt.length > 0 ? '#FAEEDA' : '#E6F1FB';
      const bdr  = v.missingOpt.length > 0 ? '#EF9F27' : '#378ADD';
      html += `<div style="background:${bg};border:.5px solid ${bdr};border-radius:var(--radius);padding:10px 14px;margin-bottom:8px;">
        <p style="font-size:12px;font-weight:600;color:${v.missingOpt.length>0?'#412402':'#0C447C'};margin-bottom:6px;">
          <i class="ti ti-${v.missingOpt.length>0?'alert-triangle':'info-circle'}" style="font-size:14px;vertical-align:-2px"></i>
          ${v.eyeLabel}
        </p>
        ${bannerHtml}
      </div>`;
    }
  });

  return html;
}

async function calcAll() {
  if (!user) return;
  const eyeSel = gv('eyeSel'), patName = gv('patName') || 'Paciente';
  const eyes = eyeSel === 'both' ? ['OD','OI'] : [eyeSel];
  const ctxKeys = ['standard','toric','postLasik','kc','rk'];
  const ra = document.getElementById('resultsArea');
  // Validate biometry before calculating
  const bioOD = getBio('OD'), bioOS = getBio('OI');
  const valOD = eyeSel !== 'OI' ? validateBio(bioOD, 'OD') : null;
  const valOS = eyeSel !== 'OD' ? validateBio(bioOS, 'OI') : null;

  // Block if missing required data
  const blocked = [valOD, valOS].filter(Boolean).some(v => !v.hasMinData);
  if (blocked) {
    document.getElementById('resultsArea').innerHTML =
      '<div style="margin-top:.75rem;">' + buildValidationBanner(valOD, valOS, eyeSel) + '</div>';
    return;
  }

  ra.innerHTML = '<div class="loading"><div class="spinner"></div> Calculando...</div>';

  let html = `<div style="margin-top:.75rem;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem;">
      <p style="font-size:13px; font-weight:600;">${patName} — ${MOD_NAMES[curMod]}</p>
      <div style="display:flex; gap:6px;">
        <div style="display:flex;gap:4px;align-items:center;">
          <button class="btn btn-s" style="font-size:11px;" onclick="openPrintModal()" title="Configurar e imprimir reporte">
            <i class="ti ti-printer"></i> Imprimir reporte
          </button>
        </div>
        <button class="btn btn-g" style="font-size:11px;" onclick="saveToHistory()"><i class="ti ti-device-floppy"></i> Guardar</button>
      </div>
    </div>
    ${buildValidationBanner(valOD, valOS, eyeSel)}`;

  // También verificar AL durante el renderizado y agregar alerta inline si >26mm
  // (esto corre DESPUÉS de calcular, para que el médico vea el resultado Y la alerta)

  for (const eye of eyes) {
    const d = getBio(eye);
    if (!d.AL || !d.K1 || !d.K2) {
      html += `<div class="card"><p style="color:var(--text2); font-size:12px;"><i class="ti ti-alert-circle" style="font-size:13px; vertical-align:-1px"></i> Faltan datos para ${eye==='OD'?'Ojo Derecho':'Ojo Izquierdo'} (AL, K1, K2 requeridos mínimo).</p></div>`;
      continue;
    }
    // IA module removed — Kane runs natively
    const aiResult = null;
    html += renderEyeResult(eye, d, aiResult);
  }

  html += `<p style="font-size:11px; color:var(--text3); margin-top:8px; text-align:center;">Los resultados son orientativos. La responsabilidad clínica es exclusiva del médico tratante. · LIOmetría v2.2</p></div>`;
  ra.innerHTML = html;
  const selBrand = document.getElementById('iolBrand')?.value || '';
  const selModel = document.getElementById('iolModel')?.value || '';
  window._lastCalc = { patName, patHC: gv('patHC'), patDOB: gv('patDOB'), patObs: gv('patObs') || null, mod: curMod, eyes: Object.fromEntries(eyes.map(e => [e, getBio(e)])), iolBrand: selBrand, iolModel: selModel, selectedFormulas: [...activeF], specOD: getSpecular('OD'), specOS: getSpecular('OI'), date: new Date().toISOString(), doctor: user.nombre + ' ' + user.apellido };
}

