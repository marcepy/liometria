function renderProfile() {
  const el = document.getElementById('profContent'); if (!el || !user) return;
  // Recuperar email real de Supabase Auth
  const realEmail = user._email || user.email || '—';
  el.innerHTML = `
    <div class="g2" style="gap:10px; margin-bottom:.75rem;">
      <div class="field"><label>Nombre</label><input type="text" id="pN" value="${escapeHTML(user.nombre)}"></div>
      <div class="field"><label>Apellido</label><input type="text" id="pA" value="${escapeHTML(user.apellido)}"></div>
    </div>
    <div class="g2" style="gap:10px; margin-bottom:.75rem;">
      <div class="field"><label>Matrícula profesional</label><input type="text" id="pM" value="${escapeHTML(user.matricula)}"></div>
      <div class="field"><label>Institución</label><input type="text" id="pI" value="${escapeHTML(user.institucion||'')}"></div>
    </div>
    <div class="field" style="margin-bottom:.75rem;">
      <label>Correo electrónico (no editable)</label>
      <input value="${escapeHTML(realEmail)}" readonly style="background:var(--bg2); color:var(--text2);">
    </div>
    <div class="btn-row" style="margin-bottom:1rem;">
      <button class="btn btn-p" onclick="saveProfile()"><i class="ti ti-device-floppy"></i> Guardar datos</button>
    </div>
    <div id="profStatus" style="margin-bottom:.75rem; font-size:12px;"></div>
    <div style="border-top:.5px solid var(--border); padding-top:.75rem; margin-top:.25rem;">
      <p style="font-size:12px; font-weight:600; color:var(--text); margin-bottom:.75rem;"><i class="ti ti-lock" style="font-size:14px; vertical-align:-2px; color:var(--blue)"></i> Cambiar contraseña</p>
      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:.75rem;">
        <div class="field"><label>Nueva contraseña</label><input type="password" id="pPass1" placeholder="Mínimo 6 caracteres" autocomplete="new-password"></div>
        <div class="field"><label>Confirmar nueva contraseña</label><input type="password" id="pPass2" placeholder="Repetí la contraseña" autocomplete="new-password"></div>
      </div>
      <div class="btn-row">
        <button class="btn btn-s" onclick="changePassword()"><i class="ti ti-key"></i> Cambiar contraseña</button>
      </div>
      <div id="passStatus" style="margin-top:.5rem; font-size:12px;"></div>
    </div>`;
}

async function saveProfile() {
  user.nombre = gv('pN'); user.apellido = gv('pA'); user.matricula = gv('pM'); user.institucion = gv('pI');
  const { error } = await supa.from('medicos').update({
    nombre: user.nombre, apellido: user.apellido,
    matricula: user.matricula, institucion: user.institucion
  }).eq('id', user.id);
  const st = document.getElementById('profStatus');
  if (error) { if(st) st.innerHTML = '<span style="color:#993C1D"><i class="ti ti-x"></i> Error al guardar.</span>'; return; }
  document.getElementById('docBadge').textContent = `Dr. ${user.nombre} ${user.apellido} · ${user.matricula}`;
  if(st) st.innerHTML = '<span style="color:#27500A"><i class="ti ti-check"></i> Datos actualizados correctamente.</span>';
  setTimeout(() => { if(st) st.innerHTML = ''; }, 3000);
}

async function changePassword() {
  const p1 = document.getElementById('pPass1')?.value || '';
  const p2 = document.getElementById('pPass2')?.value || '';
  const st = document.getElementById('passStatus');
  if (!p1) { if(st) st.innerHTML = '<span style="color:#993C1D">Ingresá la nueva contraseña.</span>'; return; }
  if (p1.length < 6) { if(st) st.innerHTML = '<span style="color:#993C1D">La contraseña debe tener al menos 6 caracteres.</span>'; return; }
  if (p1 !== p2) { if(st) st.innerHTML = '<span style="color:#993C1D"><i class="ti ti-x"></i> Las contraseñas no coinciden.</span>'; return; }
  if(st) st.innerHTML = '<span class="spinner"></span> Actualizando...';
  const { error } = await supa.auth.updateUser({ password: p1 });
  if (error) { if(st) st.innerHTML = `<span style="color:#993C1D"><i class="ti ti-x"></i> Error: ${escapeHTML(error.message)}</span>`; return; }
  document.getElementById('pPass1').value = '';
  document.getElementById('pPass2').value = '';
  if(st) st.innerHTML = '<span style="color:#27500A"><i class="ti ti-check"></i> Contraseña cambiada correctamente.</span>';
  setTimeout(() => { if(st) st.innerHTML = ''; }, 3000);
}

/* ============================================================
   PRINT — Zeiss IOLMaster style
