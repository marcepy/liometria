const PRINT_CFG_DEFAULT = {
  formulas:  ['Kane','Barrett','SRKT','HofferQ','Holladay1','Haigis','EVO','PearlDGS'],
  lenteBrand: '', lenteModel: '',
  range:      1.5,
  secBio:     true,  secSpec:     false,
  secObs:     true,  secIOLBlock: true,
  secFormulas: true, secCompare:  false,
  eyeOrder:   'OD_first'
};

let _pmStep = 1;
let _pmCfg  = { ...PRINT_CFG_DEFAULT };

const FORMULA_ALL = [
  { k:'Kane',      label:'Kane 2020', kane:true  },
  { k:'Barrett',   label:'Barrett II'            },
  { k:'SRKT',      label:'SRK/T'                 },
  { k:'HofferQ',   label:'Hoffer Q'              },
  { k:'Holladay1', label:'Holladay 1'            },
  { k:'Holladay2', label:'Holladay 2'            },
  { k:'Haigis',    label:'Haigis'                },
  { k:'EVO',       label:'EVO 2.0'               },
  { k:'PearlDGS',  label:'PEARL-DGS'             },
];

/* ── Abrir / cerrar ── */
function openPrintModal() {
  if (!window._lastCalc) { notify('Primero realizá un cálculo de LIO.', 'error'); return; }
  // Cargar config guardada del user o default
  const saved = user?.report_config;
  _pmCfg = saved ? { ...PRINT_CFG_DEFAULT, ...saved } : { ...PRINT_CFG_DEFAULT };
  _pmStep = 1;
  pmRenderStep1();
  pmRenderStep2();
  pmRenderStep3();
  pmUpdateNav();
  document.getElementById('printModal').style.display = 'flex';
}

function closePrintModal() {
  document.getElementById('printModal').style.display = 'none';
}

/* ── Navegación entre pasos ── */
function pmNav(dir) {
  const next = _pmStep + dir;
  if (next < 1 || next > 3) return;
  pmReadCurrentStep();
  _pmStep = next;
  pmUpdateNav();
}

function pmGoto(n) {
  if (n >= _pmStep) pmReadCurrentStep();
  _pmStep = n;
  pmUpdateNav();
}

function pmUpdateNav() {
  // Panes
  [1,2,3].forEach(n => {
    document.getElementById(`pmPane${n}`).classList.toggle('active', n === _pmStep);
    const ind = document.getElementById(`pmStep${n}ind`);
    ind.classList.toggle('active', n === _pmStep);
    ind.classList.toggle('done',   n < _pmStep);
  });
  // Subtítulo
  const subs = ['Paso 1 de 3 — Fórmulas a incluir',
                 'Paso 2 de 3 — Lente destacada y rango',
                 'Paso 3 de 3 — Secciones y orden'];
  document.getElementById('pmSubtitle').textContent = subs[_pmStep - 1];
  // Botones footer
  document.getElementById('pmBtnBack').style.display  = _pmStep > 1 ? 'block' : 'none';
  document.getElementById('pmBtnNext').style.display  = _pmStep < 3 ? 'block' : 'none';
  document.getElementById('pmBtnPrint').style.display = _pmStep === 3 ? 'block' : 'none';
}

/* ── Paso 1: Fórmulas ── */
function pmRenderStep1() {
  const container = document.getElementById('pmFormulaChips');
  container.innerHTML = FORMULA_ALL.map(f => {
    const sel = _pmCfg.formulas.includes(f.k);
    return `<button class="pm-formula-chip${sel?' sel':''}${f.kane?' kane-chip':''}"
      data-key="${f.k}" onclick="pmToggleFormula(this,'${f.k}')">
      ${f.kane ? '<i class="ti ti-math-function" style="font-size:11px;vertical-align:-1px"></i> ' : ''}${f.label}
    </button>`;
  }).join('');
}

function pmToggleFormula(btn, key) {
  const sel = btn.classList.toggle('sel');
  if (sel) { if (!_pmCfg.formulas.includes(key)) _pmCfg.formulas.push(key); }
  else { _pmCfg.formulas = _pmCfg.formulas.filter(k => k !== key); }
}

function pmSelAllFormulas(all) {
  _pmCfg.formulas = all ? FORMULA_ALL.map(f => f.k) : [];
  pmRenderStep1();
}

/* ── Paso 2: Lente + rango ── */
function pmRenderStep2() {
  // Poblar marcas
  const brandSel = document.getElementById('pmLensBrand');
  brandSel.innerHTML = '<option value="">— Marca —</option>';
  Object.keys(IOL_DB || {}).sort().forEach(b => {
    const opt = document.createElement('option');
    opt.value = b; opt.textContent = b;
    if (b === _pmCfg.lenteBrand) opt.selected = true;
    brandSel.appendChild(opt);
  });
  pmUpdateModels();

  // Rango
  document.querySelectorAll('.pm-range-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.range) === _pmCfg.range);
  });
}

function pmUpdateModels() {
  const brand = document.getElementById('pmLensBrand').value;
  const modelSel = document.getElementById('pmLensModel');
  modelSel.innerHTML = '<option value="">— Modelo —</option>';
  if (brand && IOL_DB?.[brand]) {
    Object.keys(IOL_DB[brand]).sort().forEach(m => {
      const opt = document.createElement('option');
      opt.value = m; opt.textContent = m;
      if (m === _pmCfg.lenteModel) opt.selected = true;
      modelSel.appendChild(opt);
    });
  }
}

function pmSetRange(btn) {
  document.querySelectorAll('.pm-range-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _pmCfg.range = parseFloat(btn.dataset.range);
}

/* ── Paso 3: Secciones + orden ── */
function pmRenderStep3() {
  const fields = ['secBio','secSpec','secObs','secIOLBlock','secFormulas','secCompare'];
  fields.forEach(f => {
    const el = document.getElementById('pm' + f.charAt(0).toUpperCase() + f.slice(1));
    if (el) el.checked = !!_pmCfg[f];
  });
  document.getElementById('pmOrderOD').classList.toggle('active', _pmCfg.eyeOrder !== 'OI_first');
  document.getElementById('pmOrderOI').classList.toggle('active', _pmCfg.eyeOrder === 'OI_first');
}

function pmSetOrder(order) {
  _pmCfg.eyeOrder = order;
  document.getElementById('pmOrderOD').classList.toggle('active', order !== 'OI_first');
  document.getElementById('pmOrderOI').classList.toggle('active', order === 'OI_first');
}

/* ── Leer estado actual antes de navegar ── */
function pmReadCurrentStep() {
  if (_pmStep === 2) {
    _pmCfg.lenteBrand = document.getElementById('pmLensBrand').value;
    _pmCfg.lenteModel = document.getElementById('pmLensModel').value;
  }
  if (_pmStep === 3) {
    const fields = ['secBio','secSpec','secObs','secIOLBlock','secFormulas','secCompare'];
    fields.forEach(f => {
      const el = document.getElementById('pm' + f.charAt(0).toUpperCase() + f.slice(1));
      if (el) _pmCfg[f] = el.checked;
    });
  }
}

/* ── Guardar config + ejecutar impresión ── */
async function pmExecutePrint() {
  pmReadCurrentStep();
  // Asegurar al menos una fórmula
  if (!_pmCfg.formulas.length) {
    notify('Seleccioná al menos una fórmula.', 'error'); return;
  }
  // Guardar en Supabase
  const st = document.getElementById('pmSaveStatus');
  if (st) st.textContent = 'Guardando preferencias...';
  if (user) {
    user.report_config = { ..._pmCfg };
    await supa.from('medicos').update({ report_config: _pmCfg }).eq('id', user.id);
  }
  if (st) st.textContent = '';
  closePrintModal();
  // Ejecutar con la config
  printReport('formulas', _pmCfg);
}
