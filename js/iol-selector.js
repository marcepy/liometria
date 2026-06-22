function initIOLSelector() {
  const brandSel = document.getElementById('iolBrand');
  if (!brandSel) return;
  Object.keys(IOL_DB).forEach(brand => {
    const opt = document.createElement('option');
    opt.value = brand; opt.textContent = brand;
    brandSel.appendChild(opt);
  });
}

function filterIOLs() {
  const brand = document.getElementById('iolBrand').value;
  const modelSel = document.getElementById('iolModel');
  modelSel.innerHTML = '<option value="">— Seleccionar modelo —</option>';
  document.getElementById('iolType').value = '';
  document.getElementById('iolInfo').style.display = 'none';
  if (!brand || !IOL_DB[brand]) return;
  Object.keys(IOL_DB[brand]).forEach(model => {
    const opt = document.createElement('option');
    opt.value = model; opt.textContent = model;
    modelSel.appendChild(opt);
  });
}

function applyIOL() {
  const brand = document.getElementById('iolBrand').value;
  const model = document.getElementById('iolModel').value;
  if (!brand || !model || !IOL_DB[brand]?.[model]) return;
  const iol = IOL_DB[brand][model];

  // Llenar constante A en ambos ojos
  ['OD_A','OI_A'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = iol.A;
  });

  // Mostrar tipo
  document.getElementById('iolType').value = iol.tipo;

  // Mostrar info del LIO
  const infoEl = document.getElementById('iolInfo');
  const cylInfo = iol.torico ? `<br>Cilíndrico disponible: ${iol.cyl_lio.map(c=>c.toFixed(2)+'D').join(' · ')} (pasos de ${iol.paso_cyl}D)` : '';
  const haigisInfo = iol.haigis
    ? `<br>Haigis: a0=${iol.haigis.a0} &nbsp; a1=${iol.haigis.a1} &nbsp; a2=${iol.haigis.a2}`
    : '';
  const sfInfo = iol.sf ? ` &nbsp;·&nbsp; SF: ${iol.sf}` : '';
  infoEl.innerHTML = `
    <strong>${brand} ${model}</strong><br>
    Material: ${iol.material} &nbsp;·&nbsp; Cte-A: <strong>${iol.A}</strong> &nbsp;·&nbsp; ACD: ${iol.acd}mm${sfInfo}<br>
    Rango esférico: ${iol.rango[0]} – ${iol.rango[1]} D (pasos de ${iol.paso}D)${cylInfo}${haigisInfo}<br>
    <span style="color:var(--text3)">${iol.notas}</span>`;
  infoEl.style.display = 'block';

  // Si es tórico, activar módulo tórico automáticamente
  if (iol.torico && curMod !== 1) {
    setMod(1);
  }
}

// Encontrar potencia disponible más cercana dado un resultado calculado
function nearestAvailable(power, iol) {
  if (!iol || power == null) return null;
  const paso = iol.paso || 0.5;
  const min = iol.rango[0], max = iol.rango[1];
  // Round to nearest step
  const rounded = Math.round(power / paso) * paso;
  if (rounded < min) return min;
  if (rounded > max) return max;
  return Math.round(rounded * 10) / 10;
}

// Encontrar potencias disponibles adyacentes (±1 paso)
function availableRange(power, iol) {
  if (!iol || power == null) return null;
  const paso = iol.paso || 0.5;
  const nearest = nearestAvailable(power, iol);
  const prev = Math.max(iol.rango[0], Math.round((nearest - paso) * 10) / 10);
  const next = Math.min(iol.rango[1], Math.round((nearest + paso) * 10) / 10);
  return { nearest, prev, next, paso };
}

// Obtener LIO actualmente seleccionado
function getSelectedIOL() {
  const brand = document.getElementById('iolBrand')?.value;
  const model = document.getElementById('iolModel')?.value;
  if (!brand || !model) return null;
  return IOL_DB[brand]?.[model] || null;
}

/* ============================================================
   DISPONIBILIDAD — Agregar al resultado de cada ojo
   ============================================================ */
function buildAvailabilityBlock(calcResult, iol) {
  if (!iol || calcResult == null) return '';
  const av = availableRange(calcResult, iol);
  if (!av) return '';
  const exact = Math.abs(av.nearest - calcResult) < 0.01;
  return `
    <div style="margin-top:8px; background:var(--bg2); border-radius:var(--radius); padding:8px 12px; border-left:3px solid var(--blue);">
      <p style="font-size:11px; font-weight:600; color:var(--text); margin-bottom:4px;">
        <i class="ti ti-package" style="font-size:12px; vertical-align:-1px"></i>
        Disponibilidad — ${document.getElementById('iolModel')?.value || 'LIO seleccionado'}
      </p>
      <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:11px;">
        <span>Calculada: <strong>${calcResult?.toFixed(2)} D</strong></span>
        <span>Disponible más cercana: <strong style="color:var(--blue)">${av.nearest.toFixed(1)} D</strong>${exact?' ✓':''}</span>
        <span>Adyacentes: ${av.prev.toFixed(1)} D · ${av.next.toFixed(1)} D</span>
        <span style="color:var(--text3)">Pasos: ${av.paso} D</span>
      </div>
    </div>`;
}

/* ============================================================
