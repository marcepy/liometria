/* ============================================================
   MÓDULO POSTOP — Refracción postoperatoria + Análisis de error
   ============================================================
   REQUIERE en Supabase — ejecutar una vez en el SQL editor:

   ALTER TABLE calculos
     ADD COLUMN IF NOT EXISTS postop_od  jsonb,
     ADD COLUMN IF NOT EXISTS postop_oi  jsonb;

   Estructura de postop_od / postop_oi:
   { sph, cyl, axis, va, date, obs, se, errors: {Kane, Barrett, ...} }
   ============================================================ */

let _postopCalcId = null;   // ID del cálculo que se está editando

/* ── Utilidades ── */
function calcSE_rx(sph, cyl) {
  const s = parseFloat(sph), c = parseFloat(cyl);
  if (isNaN(s)) return null;
  return s + (isNaN(c) ? 0 : c / 2);
}

function calcPredErrors(calcData, se_postop, eye) {
  const d = calcData[eye === 'OD' ? 'datos_od' : 'datos_oi'];
  if (!d || se_postop == null) return {};
  const sel = new Set(calcData.selected_formulas || []);
  const VF = { Kane:0.640, Barrett:0.720, SRKT:0.700, HofferQ:0.700,
               Holladay1:0.700, Holladay2:0.700, Haigis:0.700, EVO:0.700, PearlDGS:0.700 };
  const FNS = { Kane:calcKane, Barrett:calcBarrett, SRKT:calcSRKT,
                HofferQ:calcHofferQ, Holladay1:calcHolladay1, Haigis:calcHaigis,
                EVO:calcEVO, PearlDGS:calcPearlDGS, Holladay2:calcHolladay2 };
  const errors = {};
  Object.entries(FNS).forEach(([k, fn]) => {
    if (!sel.has(k)) return;
    const emme = fn(d);
    if (emme == null) return;
    const P_impl = Math.round(emme * 2) / 2;
    const rx_pred = (emme - P_impl) * (VF[k] || 0.72) + (d.T || 0);
    errors[k] = parseFloat((se_postop - rx_pred).toFixed(3));
  });
  return errors;
}

/* ── Modal ── */
function openPostopModal(calcId) {
  _postopCalcId = calcId;
  const h = _histCache.find(x => x.id === calcId);
  if (!h) return;

  // Título
  document.getElementById('postopModalTitle').textContent =
    (h.paciente_nombre || 'Paciente') + ' — Refracción postop';
  document.getElementById('postopModalSub').textContent =
    'Refracción manifiesta a 3 meses · ' +
    new Date(h.created_at).toLocaleDateString('es-PY',{day:'2-digit',month:'short',year:'numeric'});

  // Mostrar pestañas de ojo según lo calculado
  const hasOD = !!h.datos_od?.AL, hasOI = !!h.datos_oi?.AL;
  const eyeTabsEl = document.getElementById('postopEyeTabs');
  eyeTabsEl.innerHTML = '';
  if (hasOD) {
    const b = document.createElement('button');
    b.className = 'etab od active'; b.dataset.eye = 'OD';
    b.innerHTML = '<span class="eind od"></span> Ojo Derecho';
    b.onclick = () => switchPostopEye('OD');
    eyeTabsEl.appendChild(b);
  }
  if (hasOI) {
    const b = document.createElement('button');
    b.className = 'etab oi' + (!hasOD ? ' active' : ''); b.dataset.eye = 'OI';
    b.innerHTML = '<span class="eind oi"></span> Ojo Izquierdo';
    b.onclick = () => switchPostopEye('OI');
    eyeTabsEl.appendChild(b);
  }

  document.getElementById('postop_OD_block').style.display = hasOD ? 'block' : 'none';
  document.getElementById('postop_OI_block').style.display = hasOI ? 'block' : 'none';

  // Pre-cargar datos existentes si los hay
  ['OD','OI'].forEach(eye => {
    const src = eye === 'OD' ? h.postop_od : h.postop_oi;
    if (!src) return;
    const sv = (id, v) => { const el = document.getElementById(id); if(el && v!=null) el.value = v; };
    sv(`po_${eye}_sph`,  src.sph);
    sv(`po_${eye}_cyl`,  src.cyl);
    sv(`po_${eye}_axis`, src.axis);
    sv(`po_${eye}_va`,   src.va);
    if (src.date) sv(`po_${eye}_date`, src.date.slice(0,10));
  });
  document.getElementById('po_obs').value = h.postop_obs || '';

  // Limpiar estado foto
  document.getElementById('photoPreview').style.display = 'none';
  document.getElementById('postopErrPreview').style.display = 'none';
  document.getElementById('ocrStatus').innerHTML = '';

  // Auto-refresh errores al cambiar campos
  ['OD','OI'].forEach(eye => {
    ['sph','cyl','axis'].forEach(f => {
      const el = document.getElementById(`po_${eye}_${f}`);
      if (el) el.oninput = () => refreshPostopErrPreview();
    });
  });

  document.getElementById('postopModal').style.display = 'flex';
  refreshPostopErrPreview();
}

function closePostopModal() {
  document.getElementById('postopModal').style.display = 'none';
  _postopCalcId = null;
}

function switchPostopEye(eye) {
  document.querySelectorAll('#postopEyeTabs .etab').forEach(b => {
    b.classList.toggle('active', b.dataset.eye === eye);
  });
  document.getElementById('postop_OD_block').style.display = eye === 'OD' ? 'block' : 'none';
  document.getElementById('postop_OI_block').style.display = eye === 'OI' ? 'block' : 'none';
}

function refreshPostopErrPreview() {
  const h = _histCache.find(x => x.id === _postopCalcId);
  if (!h) return;

  // ── Fórmulas utilizadas en el cálculo ──────────────────────
  const sel = h.selected_formulas || [];
  const modName = MOD_NAMES[h.modulo ?? 0] || 'Estándar';
  const formulasUsedEl = document.getElementById('postopFormulasUsed');
  if (formulasUsedEl) {
    const chips = sel.map(f => {
      const isRec = f === 'Kane' || f === 'Kane_KC' || f === 'Kane_Toric';
      return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:2px 8px;
        border-radius:20px;font-weight:600;border:.5px solid;margin:2px 2px 2px 0;
        background:${isRec?'#F3EAFB':'var(--bg3)'};color:${isRec?'#4A0C7C':'var(--text2)'};
        border-color:${isRec?'#9B59D4':'var(--border2)'}">
        ${isRec?'<i class="ti ti-math-function" style="font-size:9px"></i> ':''}${FL[f]||f}
      </span>`;
    }).join('');
    formulasUsedEl.innerHTML = `
      <div style="margin-bottom:4px;">
        <span style="font-size:10px;color:var(--text3)">Módulo: <strong>${modName}</strong> &nbsp;·&nbsp;
          LIO: <strong>${h.iol_brand||'—'} ${h.iol_model||''}</strong>
        </span>
      </div>
      <div>${chips || '<span style="font-size:11px;color:var(--text3)">No registradas</span>'}</div>`;
  }

  // ── Error por fórmula para cada ojo ────────────────────────
  let rows = '';
  ['OD','OI'].forEach(eye => {
    const data = eye === 'OD' ? h.datos_od : h.datos_oi;
    if (!data?.AL) return;
    const sph = parseFloat(document.getElementById(`po_${eye}_sph`)?.value);
    const cyl = parseFloat(document.getElementById(`po_${eye}_cyl`)?.value) || 0;
    const se  = isNaN(sph) ? null : sph + cyl / 2;
    const se_el = document.getElementById(`po_${eye}_se`);
    if (se_el) se_el.textContent = se != null ? `SE = ${se >= 0 ? '+' : ''}${se.toFixed(2)} D` : '';
    if (se == null) return;

    const errors  = calcPredErrors(h, se, eye);
    const eyeColor = eye === 'OD' ? 'var(--green)' : 'var(--orange)';
    const eyeLabel = eye === 'OD' ? 'Ojo Derecho (OD)' : 'Ojo Izquierdo (OI)';

    // Separador de ojo
    if (Object.keys(errors).length) {
      rows += `<tr><td colspan="4" style="padding:6px 0 2px;font-size:10px;font-weight:700;
        color:${eyeColor};text-transform:uppercase;letter-spacing:.05em;">${eyeLabel}</td></tr>`;
    }

    // Fila por fórmula — muestra nombre + potencia calculada + Rx predicha + error
    const VF = { Kane:0.640, Barrett:0.720, SRKT:0.700, HofferQ:0.700,
                 Holladay1:0.700, Holladay2:0.700, Haigis:0.700, EVO:0.700, PearlDGS:0.700 };
    const FNS = { Kane:calcKane, Barrett:calcBarrett, SRKT:calcSRKT,
                  HofferQ:calcHofferQ, Holladay1:calcHolladay1, Haigis:calcHaigis,
                  EVO:calcEVO, PearlDGS:calcPearlDGS, Holladay2:calcHolladay2 };
    const isRec = f => f === 'Kane' || f === 'Kane_KC' || f === 'Kane_Toric';

    Object.entries(errors).forEach(([k, err]) => {
      const emme    = FNS[k] ? FNS[k](data) : null;
      const P_impl  = emme != null ? Math.round(emme * 2) / 2 : null;
      const rx_pred = emme != null ? (emme - P_impl) * (VF[k] || 0.72) + (data.T || 0) : null;
      const sign    = err >= 0 ? '+' : '';
      const absErr  = Math.abs(err);
      const errColor = absErr <= 0.25 ? '#27500A' : absErr <= 0.50 ? '#633806' : '#993C1D';
      const recMark  = isRec(k)
        ? `<i class="ti ti-math-function" style="font-size:9px;color:#9B59D4"></i> ` : '';
      const pImplStr = P_impl != null ? `${P_impl.toFixed(2)} D` : '—';
      const rxStr    = rx_pred != null ? `${rx_pred >= 0 ? '+' : ''}${rx_pred.toFixed(2)} D` : '—';

      rows += `<tr style="${isRec(k) ? 'background:rgba(155,89,212,.06)' : ''}">
        <td style="font-size:11px">${recMark}<strong>${FL[k]||k}</strong></td>
        <td style="font-size:11px;color:var(--text2);text-align:right">${pImplStr}</td>
        <td style="font-size:11px;color:var(--text3);text-align:right">${rxStr}</td>
        <td style="font-size:11px;font-weight:700;color:${errColor};text-align:right">${sign}${err.toFixed(2)} D</td>
      </tr>`;
    });
  });

  const prev = document.getElementById('postopErrPreview');
  const tbl  = document.getElementById('postopErrTable');
  if (rows) {
    tbl.innerHTML = `<table class="err-table">
      <thead><tr>
        <th>Fórmula</th>
        <th style="text-align:right">LIO (D)</th>
        <th style="text-align:right">Rx predicha</th>
        <th style="text-align:right">Error PE</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:9px;color:var(--text3);margin-top:5px">
      PE = SE postop − Rx predicha &nbsp;·&nbsp; Miopía: negativo &nbsp;·&nbsp; Hipermetropía: positivo
    </p>`;
    prev.style.display = 'block';
  } else {
    prev.style.display = 'none';
  }
}

/* ── Guardar postop ── */
async function savePostop() {
  if (!_postopCalcId || !user) return;
  const h = _histCache.find(x => x.id === _postopCalcId);
  if (!h) return;

  const upd = {};
  ['OD','OI'].forEach(eye => {
    const data = eye === 'OD' ? h.datos_od : h.datos_oi;
    if (!data?.AL) return;
    const sph  = parseFloat(document.getElementById(`po_${eye}_sph`)?.value);
    const cyl  = parseFloat(document.getElementById(`po_${eye}_cyl`)?.value) || 0;
    const axis = parseInt(document.getElementById(`po_${eye}_axis`)?.value)  || 0;
    const va   = parseFloat(document.getElementById(`po_${eye}_va`)?.value);
    const date = document.getElementById(`po_${eye}_date`)?.value;
    if (isNaN(sph)) return;
    const se = sph + cyl / 2;
    const errors = calcPredErrors(h, se, eye);
    const rec = { sph, cyl, axis, se: parseFloat(se.toFixed(3)),
                  va: isNaN(va) ? null : va, date: date || null, errors };
    upd[eye === 'OD' ? 'postop_od' : 'postop_oi'] = rec;
  });

  const obs = document.getElementById('po_obs').value.trim();
  if (obs) upd.postop_obs = obs;

  if (!Object.keys(upd).length) { notify('Ingresá al menos un campo de refracción.', 'error'); return; }

  const { error } = await supa.from('calculos').update(upd).eq('id', _postopCalcId).eq('medico_id', user.id);
  if (error) { notify('Error al guardar: ' + error.message, 'error'); return; }

  // Actualizar cache local
  const idx = _histCache.findIndex(x => x.id === _postopCalcId);
  if (idx >= 0) Object.assign(_histCache[idx], upd);

  notify('Refracción postop guardada.');
  closePostopModal();
  renderHistory();
}

/* ── OCR con IA (Claude Vision) ── */
async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    const img = document.getElementById('photoImg');
    img.src = e.target.result;
    document.getElementById('photoPreview').style.display = 'block';
    const status = document.getElementById('ocrStatus');
    status.innerHTML = '<div class="spinner"></div> Analizando imagen con IA...';

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: file.type || 'image/jpeg', data: base64 } },
              { type: 'text', text: `Esta imagen es de un autorrefractómetro o refractómetro computarizado. Extraé los datos de refracción que aparecen.
Respondé SOLO con un JSON válido, sin texto adicional, sin backticks, con esta estructura exacta:
{"OD":{"sph":null,"cyl":null,"axis":null},"OI":{"sph":null,"cyl":null,"axis":null}}
Usá null si el dato no está visible. Los valores de sph y cyl son en dioptrías (número decimal), axis en grados (entero 1-180).
Si aparece solo un ojo, ponés null en el otro. Respetá el signo (positivo o negativo) tal como aparece en la imagen.` }
            ]
          }]
        })
      });
      const data = await resp.json();
      const raw = data.content?.[0]?.text || '';
      let parsed;
      try { parsed = JSON.parse(raw.replace(/```json|```/g,'')); } catch { parsed = null; }

      if (!parsed) { status.innerHTML = '<span style="color:#993C1D">No se pudo leer la imagen. Ingresá los datos manualmente.</span>'; return; }

      // Llenar campos con los datos extraídos
      let filled = 0;
      ['OD','OI'].forEach(eye => {
        const src = eye === 'OD' ? parsed.OD : parsed.OI;
        if (!src) return;
        const h = _histCache.find(x => x.id === _postopCalcId);
        const hasEye = eye === 'OD' ? h?.datos_od?.AL : h?.datos_oi?.AL;
        if (!hasEye) return;
        const sv = (id, v) => { if (v != null && !isNaN(v)) { document.getElementById(id).value = v; filled++; } };
        sv(`po_${eye}_sph`,  src.sph);
        sv(`po_${eye}_cyl`,  src.cyl);
        sv(`po_${eye}_axis`, src.axis);
      });

      if (filled > 0) {
        status.innerHTML = `<span style="color:#27500A"><i class="ti ti-check" style="font-size:12px"></i> ${filled} campos completados. Verificá los valores antes de guardar.</span>`;
        refreshPostopErrPreview();
      } else {
        status.innerHTML = '<span style="color:#633806">IA no encontró datos legibles. Ingresá manualmente.</span>';
      }
    } catch (err) {
      status.innerHTML = '<span style="color:#993C1D">Error de conexión con IA. Ingresá los datos manualmente.</span>';
    }
  };
  reader.readAsDataURL(file);
}

