function toggleSpecular(eye) {
  const panel = document.getElementById(eye + '_specPanel');
  const icon  = document.getElementById(eye + '_specIcon');
  if (!panel) return;
  const open = panel.style.display === 'none';
  panel.style.display = open ? 'block' : 'none';
  if (icon) icon.style.transform = open ? 'rotate(90deg)' : '';
}

// Umbrales clínicos para faco:
//   CD: >2000 normal · 1000-2000 riesgo moderado · <1000 alto riesgo / contraindicación relativa
//   CV: <33% normal · 33-40% moderado · >40% alterado (polimegatismo)
//   6A: >60% normal · 40-60% moderado · <40% pleomorfismo severo (hexagonalidad)

function checkCD(eye, val) {
  const n = parseFloat(val);
  const el = document.getElementById(eye + '_CDAlert');
  if (!el || isNaN(n)) { if(el) el.textContent=''; updateSpecSummary(eye); return; }
  if (n >= 2000) {
    el.style.color = '#27500A'; el.textContent = '✓ Normal';
  } else if (n >= 1500) {
    el.style.color = '#633806'; el.textContent = '⚠ Riesgo moderado';
  } else if (n >= 1000) {
    el.style.color = '#993C1D'; el.textContent = '⚠ Riesgo alto';
  } else {
    el.style.color = '#993C1D'; el.textContent = '✗ Contraindicación relativa';
  }
  updateSpecSummary(eye);
}

function checkCV(eye, val) {
  const n = parseFloat(val);
  const el = document.getElementById(eye + '_CVAlert');
  if (!el || isNaN(n)) { if(el) el.textContent=''; updateSpecSummary(eye); return; }
  if (n <= 33) {
    el.style.color = '#27500A'; el.textContent = '✓ Normal';
  } else if (n <= 40) {
    el.style.color = '#633806'; el.textContent = '⚠ Polimegatismo leve';
  } else {
    el.style.color = '#993C1D'; el.textContent = '⚠ Polimegatismo severo';
  }
  updateSpecSummary(eye);
}

function check6A(eye, val) {
  const n = parseFloat(val);
  const el = document.getElementById(eye + '_6AAlert');
  if (!el || isNaN(n)) { if(el) el.textContent=''; updateSpecSummary(eye); return; }
  if (n >= 60) {
    el.style.color = '#27500A'; el.textContent = '✓ Normal';
  } else if (n >= 40) {
    el.style.color = '#633806'; el.textContent = '⚠ Pleomorfismo leve';
  } else {
    el.style.color = '#993C1D'; el.textContent = '⚠ Pleomorfismo severo';
  }
  updateSpecSummary(eye);
}

function updateSpecSummary(eye) {
  const summEl = document.getElementById(eye + '_specSummary');
  if (!summEl) return;
  const cd  = parseFloat(document.getElementById(eye+'_CD')?.value);
  const cv  = parseFloat(document.getElementById(eye+'_CV')?.value);
  const a6  = parseFloat(document.getElementById(eye+'_6A')?.value);
  const cct = parseFloat(document.getElementById(eye+'_CCT_esp')?.value);

  if (isNaN(cd) && isNaN(cv) && isNaN(a6)) { summEl.style.display='none'; return; }
  summEl.style.display = 'block';

  // Evaluación de riesgo global
  let riesgo = 0, items = [];
  if (!isNaN(cd)) {
    if      (cd < 1000) { riesgo = Math.max(riesgo, 3); items.push(`CD ${cd} cél/mm² — Contraindicación relativa`); }
    else if (cd < 1500) { riesgo = Math.max(riesgo, 2); items.push(`CD ${cd} cél/mm² — Riesgo alto`); }
    else if (cd < 2000) { riesgo = Math.max(riesgo, 1); items.push(`CD ${cd} cél/mm² — Riesgo moderado`); }
    else                                                  items.push(`CD ${cd} cél/mm² ✓`);
  }
  if (!isNaN(cv)) {
    if      (cv > 40) { riesgo = Math.max(riesgo, 2); items.push(`CV ${cv}% — Polimegatismo severo`); }
    else if (cv > 33) { riesgo = Math.max(riesgo, 1); items.push(`CV ${cv}% — Polimegatismo leve`); }
    else                                               items.push(`CV ${cv}% ✓`);
  }
  if (!isNaN(a6)) {
    if      (a6 < 40) { riesgo = Math.max(riesgo, 2); items.push(`6A ${a6}% — Pleomorfismo severo`); }
    else if (a6 < 60) { riesgo = Math.max(riesgo, 1); items.push(`6A ${a6}% — Pleomorfismo leve`); }
    else                                               items.push(`6A ${a6}% ✓`);
  }
  if (!isNaN(cct)) items.push(`CCT ${cct} µm`);

  const colors = { 0:'#27500A', 1:'#633806', 2:'#993C1D', 3:'#993C1D' };
  const labels = { 0:'✓ Endotelio apto para cirugía', 1:'⚠ Endotelio con riesgo moderado — monitorear',
                   2:'⚠ Endotelio con riesgo alto — evaluar con cuidado',
                   3:'✗ Riesgo muy alto — contraindicación relativa' };
  const bgs    = { 0:'#EAF3DE', 1:'#FAEEDA', 2:'#FDECEA', 3:'#FDECEA' };

  summEl.style.background = bgs[riesgo];
  summEl.style.color = colors[riesgo];
  summEl.innerHTML = `<strong>${labels[riesgo]}</strong><br>${items.join(' &nbsp;·&nbsp; ')}`;
}

function getSpecular(eye) {
  const cd  = document.getElementById(eye+'_CD')?.value;
  const cv  = document.getElementById(eye+'_CV')?.value;
  const a6  = document.getElementById(eye+'_6A')?.value;
  const cct = document.getElementById(eye+'_CCT_esp')?.value;
  if (!cd && !cv && !a6 && !cct) return null;
  return {
    CD: cd ? parseFloat(cd) : null,
    CV: cv ? parseFloat(cv) : null,
    A6: a6 ? parseFloat(a6) : null,
    CCT_esp: cct ? parseFloat(cct) : null,
  };
}

function setSpecular(eye, data) {
  if (!data) return;
  const setV = (id, v) => { const el = document.getElementById(id); if(el && v!=null) { el.value=v; } };
  setV(eye+'_CD',  data.CD);
  setV(eye+'_CV',  data.CV);
  setV(eye+'_6A',  data.A6);
  setV(eye+'_CCT_esp', data.CCT_esp);
  if (data.CD != null)  checkCD(eye, data.CD);
  if (data.CV != null)  checkCV(eye, data.CV);
  if (data.A6 != null)  check6A(eye, data.A6);
  // Auto-open panel if has data
  const panel = document.getElementById(eye + '_specPanel');
  const icon  = document.getElementById(eye + '_specIcon');
  if (panel && data.CD != null) {
    panel.style.display = 'block';
    if (icon) icon.style.transform = 'rotate(90deg)';
  }
}

function updateK1Axis(eye, val) {
  const hint = document.getElementById(eye + '_K1axisHint');
  if (!hint) return;
  const v = parseInt(val);
  if (!v || v < 1 || v > 180) { hint.textContent = ''; return; }
  const k1axis = ((v + 90 - 1) % 180) + 1;
  hint.textContent = '→ K1 (plana) queda a ' + k1axis + '°';
}

/* ============================================================
   MÓDULO CONFIGURACIÓN DE REPORTE — Modal 3 pasos
   Guarda preferencias en medicos.report_config (jsonb)

   SQL requerido (ejecutar una vez):
   ALTER TABLE medicos ADD COLUMN IF NOT EXISTS report_config jsonb;
   ============================================================ */
