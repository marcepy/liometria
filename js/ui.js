function gv(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function gn(id) { const el = document.getElementById(id); return el ? parseFloat(el.value) || null : null; }

// SEGURIDAD: escapar caracteres HTML antes de insertar datos de usuario en innerHTML.
// Previene XSS cuando se renderizan nombres de pacientes, matrículas, etc.
function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (id === 'histTab')   renderHistory();
  if (id === 'profTab')   renderProfile();
  if (id === 'resultTab') renderResults();
  if (id === 'simTab')    renderSimTab();
}

function swEye(e) {
  curEye = e;
  document.getElementById('bioOD').style.display = e === 'OD' ? 'block' : 'none';
  document.getElementById('bioOI').style.display = e === 'OI' ? 'block' : 'none';
  document.getElementById('etOD').classList.toggle('active', e === 'OD');
  document.getElementById('etOI').classList.toggle('active', e === 'OI');
}

function setMod(m) {
  curMod = m;
  [0,1,2,3,4].forEach(i => document.getElementById('mod'+i).classList.toggle('active', i === m));
  document.getElementById('modDesc').textContent = MODS[m].desc;
  ['toricCard','postLasikCard','kcCard','rkCard'].forEach((id, i) => {
    document.getElementById(id).classList.toggle('hidden', m !== i+1);
  });
  const ctxLabels = ['— Estándar','— Tórico','— Post-LASIK/PRK','— Queratocono','— Queratotomía Radiada'];
  document.getElementById('fCtx').textContent = ctxLabels[m];
  renderFormulas(m);
}

function renderFormulas(m) {
  const list = FORMULA_SETS[m];
  activeF = new Set([list[0], list[1]]);
  const grid = document.getElementById('formulaGrid');
  grid.innerHTML = list.map(f => {
    const isAI = f.startsWith('AI');
    const isKane = f === 'Kane' || f === 'Kane_KC';
    return `<div class="fchip${isAI?' ai':''}${isKane?' kane':''}${activeF.has(f)?' active':''}" id="chip_${f}" onclick="togF('${f}')">${isAI ? '<i class="ti ti-sparkles" style="font-size:11px"></i> ' : isKane ? '<i class="ti ti-math-function" style="font-size:11px"></i> ' : ''}${FL[f]}</div>`;
  }).join('');
}

function togF(f) {
  activeF.has(f) ? activeF.delete(f) : activeF.add(f);
  const c = document.getElementById('chip_'+f);
  if (c) c.classList.toggle('active', activeF.has(f));
}
