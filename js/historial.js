async function _doInsert(calc) {
  return supa.from('calculos').insert({
    medico_id: user.id,
    paciente_nombre: calc.patName || null,
    paciente_hc: calc.patHC || null,
    paciente_dob: calc.patDOB || null,
    modulo: calc.mod,
    datos_od: calc.eyes?.OD || null,
    datos_oi: calc.eyes?.OI || null,
    iol_brand: calc.iolBrand || null,
    iol_model: calc.iolModel || null,
    selected_formulas: calc.selectedFormulas || null,
    spec_od: calc.specOD || null,
    spec_oi: calc.specOS || null,
    observaciones: calc.patObs || null,
  });
}

async function _doUpdate(id, calc) {
  return supa.from('calculos').update({
    paciente_nombre: calc.patName || null,
    paciente_hc: calc.patHC || null,
    paciente_dob: calc.patDOB || null,
    modulo: calc.mod,
    datos_od: calc.eyes?.OD || null,
    datos_oi: calc.eyes?.OI || null,
    iol_brand: calc.iolBrand || null,
    iol_model: calc.iolModel || null,
    selected_formulas: calc.selectedFormulas || null,
    spec_od: calc.specOD || null,
    spec_oi: calc.specOS || null,
    observaciones: calc.patObs || null,
    created_at: new Date().toISOString(),
  }).eq('id', id).eq('medico_id', user.id);
}

function closeDupModal() {
  document.getElementById('dupModal').style.display = 'none';
}

// ── saveToHistory con detección de duplicados ─────────────────
async function saveToHistory() {
  if (!window._lastCalc || !user) return;
  const btn = event?.target?.closest('button');
  if (btn) btn.disabled = true;
  const calc = window._lastCalc;

  // ── Buscar duplicados: mismo paciente (nombre + HC) ──────────
  // Criterio: mismo paciente_nombre Y mismo paciente_hc (si existe),
  // guardado en las últimas 72 horas
  let existingId = null;
  let existingDate = null;

  if (calc.patName || calc.patHC) {
    let query = supa.from('calculos')
      .select('id, created_at, paciente_nombre, paciente_hc, modulo')
      .eq('medico_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: recent } = await query;

    if (recent?.length) {
      const match = recent.find(r => {
        const sameNombre = calc.patName && r.paciente_nombre &&
          r.paciente_nombre.trim().toLowerCase() === calc.patName.trim().toLowerCase();
        const sameHC = calc.patHC && r.paciente_hc &&
          r.paciente_hc.trim() === calc.patHC.trim();
        const sameModulo = r.modulo === calc.mod;

        // Considerar duplicado si: mismo nombre Y mismo módulo,
        // O mismo HC (independiente del módulo)
        if (sameHC) return true;
        if (sameNombre && sameModulo) return true;
        return false;
      });

      if (match) {
        existingId   = match.id;
        existingDate = match.created_at;
      }
    }
  }

  if (btn) btn.disabled = false;

  // ── Si hay duplicado, mostrar modal ──────────────────────────
  if (existingId) {
    const modal   = document.getElementById('dupModal');
    const msgEl   = document.getElementById('dupModalMsg');
    const subEl   = document.getElementById('dupModalSub');
    const updBtn  = document.getElementById('dupModalUpdate');
    const newBtn  = document.getElementById('dupModalNew');

    const fechaExist = new Date(existingDate).toLocaleDateString('es-PY',
      { day:'2-digit', month:'short', year:'numeric' });
    const horaExist  = new Date(existingDate).toLocaleTimeString('es-PY',
      { hour:'2-digit', minute:'2-digit' });

    msgEl.textContent = `Ya existe un cálculo guardado para "${calc.patName || calc.patHC}" del ${fechaExist} a las ${horaExist}.`;
    subEl.textContent = '¿Querés actualizar ese registro con los datos actuales, o guardar este cálculo como uno nuevo?';

    modal.style.display = 'flex';

    updBtn.onclick = async () => {
      closeDupModal();
      const { error } = await _doUpdate(existingId, calc);
      if (error) { notify('Error al actualizar: ' + error.message, 'error'); return; }
      notify('Cálculo actualizado en el historial.');
      if (document.getElementById('histList')) renderHistory();
    };

    newBtn.onclick = async () => {
      closeDupModal();
      const { error } = await _doInsert(calc);
      if (error) { notify('Error al guardar: ' + error.message, 'error'); return; }
      notify('Cálculo guardado como nuevo registro.');
      if (document.getElementById('histList')) renderHistory();
    };

    return;
  }

  // ── Sin duplicado: guardar directamente ──────────────────────
  const { error } = await _doInsert(calc);
  if (error) { notify('Error al guardar: ' + error.message, 'error'); return; }
  notify('Cálculo guardado en el historial.');
  if (document.getElementById('histList')) renderHistory();
}

/* ============================================================
   HISTORIAL — SUPABASE
   ============================================================ */
// Cache del historial para loadFromHistory
let _histCache = [];
renderHistory = async function() {
  const el = document.getElementById('histList'); if (!el || !user) return;
  el.innerHTML = '<div class="loading"><div class="spinner"></div> Cargando historial...</div>';
  const { data, error } = await supa.from('calculos')
    .select('*').eq('medico_id', user.id)
    .order('created_at', { ascending: false }).limit(100);
  if (error) { el.innerHTML = '<p style="color:#993C1D; font-size:12px;">Error al cargar historial.</p>'; return; }
  _histCache = data || [];
  if (!data.length) { el.innerHTML = '<p style="color:var(--text2); font-size:12px;">No hay cálculos guardados aún.</p>'; return; }
  el.innerHTML = data.map(h => {
    const hasPostop = h.postop_od || h.postop_oi;
    const postopBadge = hasPostop
      ? `<span class="postop-badge postop-ok"><i class="ti ti-check" style="font-size:9px"></i> Postop ✓</span>`
      : `<span class="postop-badge postop-pend"><i class="ti ti-clock" style="font-size:9px"></i> Sin postop</span>`;
    return `
    <div style="border:.5px solid var(--border); border-radius:var(--radius); padding:9px 12px; margin-bottom:7px; cursor:pointer; transition:background .15s;"
      onmouseover="this.style.background='var(--bg2)'" onmouseout="this.style.background=''"
      onclick="loadFromHistory(${h.id})">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
        <div>
          <p style="font-size:12px; font-weight:600;">${escapeHTML(h.paciente_nombre)||'Paciente'} ${h.paciente_hc?'· '+escapeHTML(h.paciente_hc):''}</p>
          ${h.observaciones ? `<p style="font-size:10px; color:var(--text3); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:280px;">${escapeHTML(h.observaciones)}</p>` : ''}
          <p style="font-size:11px; color:var(--text2);">
            ${new Date(h.created_at).toLocaleDateString('es-PY',{day:'2-digit',month:'short',year:'numeric'})}
            ${new Date(h.created_at).toLocaleTimeString('es-PY',{hour:'2-digit',minute:'2-digit'})}
            &nbsp;·&nbsp; <span style="color:var(--blue); font-weight:500;">Clic para cargar</span>
          </p>
        </div>
        <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center;">
          ${h.modulo!=null?`<span class="badge ${MOD_BADGES[h.modulo]}">${MOD_NAMES[h.modulo]}</span>`:''}
          ${h.datos_od?.AL?`<span class="badge" style="background:#E1F5EE;color:#085041;border-color:#5DCAA5">OD ${h.datos_od.AL}mm</span>`:''}
          ${h.datos_oi?.AL?`<span class="badge" style="background:#FAECE7;color:#4A1B0C;border-color:#F0997B">OI ${h.datos_oi.AL}mm</span>`:''}
          ${postopBadge}
          <button onclick="event.stopPropagation(); openPostopModal(${h.id})"
            style="display:flex;align-items:center;gap:4px;background:none;
                   border:.5px solid var(--border);border-radius:7px;cursor:pointer;
                   color:var(--text2);font-size:11px;padding:4px 10px;transition:all .15s;"
            onmouseover="this.style.background='#EAF3DE';this.style.color='#27500A';this.style.borderColor='#97C459'"
            onmouseout="this.style.background='none';this.style.color='var(--text2)';this.style.borderColor='var(--border)'"
            title="Registrar refracción postoperatoria">
            <i class="ti ti-eye-check" style="font-size:13px"></i>
            <span>${hasPostop ? 'Editar postop' : 'Registrar postop'}</span>
          </button>
          <button onclick="event.stopPropagation(); openDeleteModal(${h.id}, this.dataset.name, this)"
            data-name="${(h.paciente_nombre||'Paciente').replace(/"/g,'&quot;')}"
            style="display:flex;align-items:center;gap:4px;background:none;
                   border:.5px solid var(--border);border-radius:7px;cursor:pointer;
                   color:var(--text3);font-size:11px;padding:4px 10px;transition:all .15s;"
            onmouseover="this.style.background='#FDECEA';this.style.color='#993C1D';this.style.borderColor='#F0997B'"
            onmouseout="this.style.background='none';this.style.color='var(--text3)';this.style.borderColor='var(--border)'"
            title="Eliminar este cálculo">
            <i class="ti ti-trash" style="font-size:13px"></i>
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
};

function loadFromHistory(id) {
  const h = _histCache.find(x => x.id === id);
  if (!h) return;

  // Ir al tab de calcular
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('calcTab').classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.nav-btn').classList.add('active');

  // Setear módulo
  setMod(h.modulo || 0);

  // Llenar datos del paciente
  const setV = (id, val) => { const el = document.getElementById(id); if(el && val!=null) el.value = val; };
  setV('patName', h.paciente_nombre);
  setV('patHC',   h.paciente_hc);
  if (h.paciente_dob) setV('patDOB', h.paciente_dob.slice(0,10));
  const obsEl = document.getElementById('patObs'); if (obsEl) obsEl.value = h.observaciones || '';

  // Llenar biometría OD
  const od = h.datos_od;
  if (od) {
    setV('OD_AL',   od.AL);   setV('OD_K1',  od.K1);  setV('OD_K2', od.K2);
    setV('OD_Kaxis',od.Kaxis);setV('OD_ACD', od.ACD); setV('OD_LT', od.LT);
    setV('OD_CCT',  od.CCT);  setV('OD_WTW', od.WTW); setV('OD_A',  od.A);
    setV('OD_T',    od.T);
    const sexEl = document.getElementById('OD_Sex');
    if (sexEl && od.Sex) sexEl.value = od.Sex;
  }

  // Llenar biometría OI
  const oi = h.datos_oi;
  if (oi) {
    setV('OI_AL',   oi.AL);   setV('OI_K1',  oi.K1);  setV('OI_K2', oi.K2);
    setV('OI_Kaxis',oi.Kaxis);setV('OI_ACD', oi.ACD); setV('OI_LT', oi.LT);
    setV('OI_CCT',  oi.CCT);  setV('OI_WTW', oi.WTW); setV('OI_A',  oi.A);
    setV('OI_T',    oi.T);
    const sexEl = document.getElementById('OI_Sex');
    if (sexEl && oi.Sex) sexEl.value = oi.Sex;
  }

  // Determinar ojo activo
  if (od?.AL && !oi?.AL) swEye('OD');
  else if (oi?.AL && !od?.AL) swEye('OI');
  else swEye('OD');

  // Ajustar selector de ojo
  const eyeSel = document.getElementById('eyeSel');
  if (eyeSel) {
    if (od?.AL && oi?.AL) eyeSel.value = 'both';
    else if (od?.AL) eyeSel.value = 'OD';
    else eyeSel.value = 'OI';
  }

  // Restaurar microscopía especular
  if (h.spec_od) setSpecular('OD', h.spec_od);
  if (h.spec_oi) setSpecular('OI', h.spec_oi);

  // Restaurar LIO seleccionado
  if (h.iolBrand && h.iolModel) {
    const brandSel = document.getElementById('iolBrand');
    if (brandSel) {
      brandSel.value = h.iolBrand;
      filterIOLs();
      const modelSel = document.getElementById('iolModel');
      if (modelSel) { modelSel.value = h.iolModel; applyIOL(); }
    }
  }
  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openDeleteModal(id, patName, btn) {
  const modal = document.getElementById('deleteModal');
  const msg   = document.getElementById('deleteModalMsg');
  const confirmBtn = document.getElementById('deleteModalConfirm');
  msg.textContent = `¿Estás seguro que querés eliminar el cálculo de "${patName || 'este paciente'}"? Esta acción no se puede deshacer.`;
  modal.style.display = 'flex';
  // Asignar handler al botón confirmar
  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Eliminando...';
    const { error } = await supa.from('calculos').delete().eq('id', id);
    closeDeleteModal();
    if (error) { notify('Error al eliminar el registro.', 'error'); return; }
    notify('Cálculo eliminado del historial.');
    renderHistory();
  };
}

function closeDeleteModal() {
  const modal = document.getElementById('deleteModal');
  modal.style.display = 'none';
  const confirmBtn = document.getElementById('deleteModalConfirm');
  confirmBtn.disabled = false;
  confirmBtn.textContent = 'Eliminar';
}

// Cerrar modales al hacer clic fuera
document.addEventListener('click', e => {
  const delModal = document.getElementById('deleteModal');
  if (delModal && e.target === delModal) closeDeleteModal();
  const dupModal = document.getElementById('dupModal');
  if (dupModal && e.target === dupModal) closeDupModal();
});
