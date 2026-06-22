/* ============================================================
   SUPABASE
   Las credenciales se cargan desde js/env.js (gitignored).
   Para configurar: copiá js/env.example.js → js/env.js
   ============================================================ */
if (!window.ENV || !window.ENV.SUPABASE_URL) {
  console.error('[LIOmetría] Falta js/env.js — copiá js/env.example.js → js/env.js y completá tus credenciales de Supabase.');
}
const SUPA_URL = window.ENV?.SUPABASE_URL || '';
const SUPA_KEY = window.ENV?.SUPABASE_KEY || '';
const supa = supabase.createClient(SUPA_URL, SUPA_KEY);

/* ============================================================
   STATE
   ============================================================ */
let user = null, curMod = 0, curEye = 'OD', activeF = new Set();
// IA module removed

/* ============================================================
   MÓDULOS Y FÓRMULAS
   ============================================================ */
const MODS = [
  { label:'Estándar', desc:'Cálculo para ojos sin cirugía corneal previa. Kane 2020 (nativa), Barrett Universal II, SRK/T, Hoffer Q, Holladay 1 y 2, Haigis, EVO 2.0, PEARL-DGS.' },
  { label:'Tórico', desc:'Selección de LIO tórico con cálculo vectorial del astigmatismo corneal neto, corrección de astigmatismo corneal posterior (ACP) y eje de implantación sugerido.' },
  { label:'Post-LASIK/PRK', desc:'Ajuste de K efectiva post-láser. Barrett True-K, Haigis-L, Shammas, Masket. Objetivo recomendado: -0.25 a -0.50D.' },
  { label:'Queratocono', desc:'Compensación de la sobreestimación de potencia en córneas ectásicas. Estadificación Amsler-Krumeich. Objetivo levemente miópico (-0.75 a -1.0D) como margen de seguridad.' },
  { label:'KR', desc:'Manejo de la K artificialmente plana y la hipermetropización progresiva post-queratotomía radiada. Objetivo miópico (-1.0D) recomendado. Double-K para corregir artefacto de ELP.' }
];

const FORMULA_SETS = [
  ['Kane','Barrett','SRKT','HofferQ','Holladay1','Haigis','EVO','PearlDGS','Holladay2'],
  ['Barrett_Toric','EVO_Toric','Holladay2_Toric','Kane_Toric'],
  ['BarrettTrueK','BarrettTrueKNH','HaigisL','Shammas','ShammasNH','Masket'],
  ['Kane_KC','BarrettTrueK_KC','Haigis_KC','HofferQ_KC'],
  ['BarrettTrueK_RK','DoubleK','HaigisL_RK','ASCRS_KR']
];

const FL = {
  Kane:'Kane 2020', Barrett:'Barrett Univ. II', SRKT:'SRK/T', HofferQ:'Hoffer Q',
  Holladay1:'Holladay 1', Haigis:'Haigis', EVO:'EVO 2.0', PearlDGS:'PEARL-DGS', Holladay2:'Holladay 2',
  Kane_Toric:'Kane Tórico', Barrett_Toric:'Barrett Tórico', EVO_Toric:'EVO Tórico', Holladay2_Toric:'Holladay 2 Tórico',
  BarrettTrueK:'Barrett True-K', BarrettTrueKNH:'Barrett True-K (sin hist.)',
  HaigisL:'Haigis-L', Shammas:'Shammas', ShammasNH:'Shammas (sin hist.)', Masket:'Masket',
  Kane_KC:'Kane KC', BarrettTrueK_KC:'Barrett True-K KC', Haigis_KC:'Haigis (KC)', HofferQ_KC:'Hoffer Q (KC)',
  BarrettTrueK_RK:'Barrett True-K (KR)', DoubleK:'Double-K Holladay', HaigisL_RK:'Haigis-L (KR)', ASCRS_KR:'ASCRS KR'
};

const MOD_NOTES = [
  (AL) => AL < 22 ? 'Ojo corto — Hoffer Q y PEARL-DGS más precisos.' : AL > 26 ? '⚠️ OJO LARGO (AL>26mm) — Verificar obligatoriamente con Barrett APACRS (calc.apacrs.org) o Kane iolformula.com. LIOmetría diverge >1D en este rango.' : 'Long. axial normal — Kane 2020, Barrett II y EVO 2.0 ofrecen mayor precisión.',
  () => 'Verificar eje de implantación con marcador intraoperatorio o imagen de segmento anterior.',
  () => 'K clínica sobreestima la potencia post-refractiva. Priorizar Barrett True-K o Haigis-L. Objetivo: -0.25 a -0.50D.',
  () => 'En KC apuntar a -0.75 a -1.0D. Mayor incertidumbre refractiva postoperatoria — comunicar al paciente.',
  () => 'KR: hipermetropización progresiva esperada. Objetivo -1.0D. Variación diurna > 1.5D indica inestabilidad significativa.'
];

const MOD_BADGES = ['b-ai','b-toric','b-post','b-kc','b-rk'];
const MOD_NAMES = ['Estándar','Tórico','Post-LASIK/PRK','Queratocono','KR'];

/* ============================================================
