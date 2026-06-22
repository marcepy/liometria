function toggleRegForm() {
  const lf = document.getElementById('loginForm'), rf = document.getElementById('registerForm');
  rf.style.display = rf.style.display === 'none' ? 'block' : 'none';
  lf.style.display = lf.style.display === 'none' ? 'block' : 'none';
}

async function doRegister() {
  const n = gv('regN'), a = gv('regA'), m = gv('regM'), inst = gv('regI'),
        city = gv('regC'), email = gv('regE').toLowerCase(), pass = gv('regP');
  if (!n || !a || !m || !email || !pass) { notify('Complete todos los campos obligatorios (*).', 'error'); return; }
  if (pass.length < 6) { notify('La contraseña debe tener mínimo 6 caracteres.', 'error'); return; }
  setLoginStatus('Creando cuenta...', 'info');

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authErr } = await supa.auth.signUp({ email, password: pass });
  if (authErr) { setLoginStatus('Error al crear cuenta: ' + authErr.message, 'error'); return; }
  if (!authData?.user) { setLoginStatus('Error inesperado. Intentá nuevamente.', 'error'); return; }

  // 2. Si hay sesión activa (email confirm desactivado), usarla para el INSERT
  if (authData.session) {
    await supa.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token
    });
  }

  // 3. INSERT en medicos — requiere sesión activa para satisfacer RLS
  const { error: profErr } = await supa.from('medicos').insert({
    id: authData.user.id,
    nombre: n, apellido: a,
    matricula: m, institucion: inst || '', ciudad: city
  });

  if (profErr) {
    if (profErr.code === '42501' || profErr.message.includes('row-level security')) {
      // Email confirmation pendiente — guardar perfil localmente, completar al primer login
      try {
        // SEGURIDAD: usar sessionStorage en lugar de localStorage para evitar
        // persistencia de PII médico entre sesiones del navegador.
        // El perfil se completa al hacer login tras confirmar el email.
        sessionStorage.setItem('liometria_pending_profile', JSON.stringify({
          id: authData.user.id, nombre: n, apellido: a,
          matricula: m, institucion: inst || '', ciudad: city
          // email omitido intencionalmente — Supabase Auth ya lo tiene
        }));
      } catch(e) {
        console.warn('[LIOmetría] No se pudo guardar perfil pendiente en sessionStorage:', e);
      }
      setLoginStatus('', '');
      notify('Cuenta creada. Revisá tu correo, confirmá la cuenta y luego ingresá.');
      toggleRegForm();
      return;
    }
    setLoginStatus('Error al guardar perfil: ' + profErr.message, 'error');
    return;
  }

  setLoginStatus('', '');
  notify('Cuenta creada correctamente. Ingresá con tus datos.');
  toggleRegForm();
}

async function doLogin() {
  const email = gv('loginEmail').trim().toLowerCase(), pass = gv('loginPass');
  if (!email || !pass) { setLoginStatus('Ingresá correo y contraseña.', 'error'); return; }
  // Validar formato de email con regex RFC 5322 simplificado
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    setLoginStatus('El correo electrónico no tiene un formato válido.', 'error'); return;
  }
  setLoginStatus('Ingresando...', 'info');
  let data, error;
  try {
    ({ data, error } = await supa.auth.signInWithPassword({ email, password: pass }));
  } catch(e) {
    setLoginStatus('Error de conexión. Verificá tu conexión a internet.', 'error'); return;
  }
  if (error) {
    // Mensajes de error más descriptivos según el tipo
    const msg = error.message || '';
    if (msg.includes('Email not confirmed')) {
      setLoginStatus('Debés confirmar tu correo antes de ingresar. Revisá tu bandeja de entrada.', 'error');
    } else if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
      setLoginStatus('Correo o contraseña incorrectos. Verificá tus datos.', 'error');
    } else if (msg.includes('Too many requests')) {
      setLoginStatus('Demasiados intentos. Esperá unos minutos antes de intentar nuevamente.', 'error');
    } else {
      setLoginStatus('Error al ingresar: ' + msg, 'error');
    }
    return;
  }

  // Verificar si hay perfil pendiente de crear (caso email confirmation)
  try {
    const pending = JSON.parse(sessionStorage.getItem('liometria_pending_profile') || 'null');
    if (pending && pending.id === data.user.id) {
      const { error: pe } = await supa.from('medicos').insert({
        id: pending.id, nombre: pending.nombre, apellido: pending.apellido,
        matricula: pending.matricula, institucion: pending.institucion, ciudad: pending.ciudad
      });
      if (!pe) sessionStorage.removeItem('liometria_pending_profile');
      else console.warn('[LIOmetría] Error al crear perfil pendiente:', pe.message);
    }
  } catch(e) {
    console.warn('[LIOmetría] Error al procesar perfil pendiente:', e);
  }

  // Cargar perfil del médico
  const { data: prof, error: profErr } = await supa.from('medicos').select('*').eq('id', data.user.id).single();
  if (profErr || !prof) { setLoginStatus('No se encontró el perfil médico. Registrate primero.', 'error'); await supa.auth.signOut(); return; }
  user = { ...prof, id: data.user.id, _email: data.user.email };
  setLoginStatus('', '');
  showApp();
}


async function logout() {
  await supa.auth.signOut();
  user = null;
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('appPage').classList.remove('active');
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('docBadge').classList.add('hidden');
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPass').value = '';
}

function setLoginStatus(msg, type) {
  let el = document.getElementById('loginStatus');
  if (!el) { el = document.createElement('p'); el.id = 'loginStatus'; el.style.cssText = 'font-size:12px;margin-top:.5rem;text-align:center'; document.querySelector('#loginForm, #registerForm').parentNode.appendChild(el); }
  el.textContent = msg;
  el.style.color = type === 'error' ? '#993C1D' : type === 'info' ? 'var(--text2)' : 'inherit';
}

// Reemplaza alert() nativo — compatible con todos los contextos
function notify(msg, type='info') {
  // Usar toast en lugar de alert()
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:9999;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,.25);max-width:420px;text-align:center;transition:opacity .3s;';
    document.body.appendChild(toast);
  }
  const isErr = type === 'error';
  toast.style.background = isErr ? '#FDECEA' : '#EAF3DE';
  toast.style.color      = isErr ? '#993C1D' : '#27500A';
  toast.style.border     = isErr ? '1px solid #F0997B' : '1px solid #97C459';
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

function showApp() {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('appPage').classList.add('active');
  document.getElementById('logoutBtn').style.display = 'inline-flex';
  const b = document.getElementById('docBadge');
  b.classList.remove('hidden');
  b.textContent = `Dr. ${user.nombre} ${user.apellido} · ${user.matricula}`;
  setMod(0);
  renderProfile();
  renderHistory();

}

// Restaurar sesión al cargar la página
async function initSession() {
  const { data: { session } } = await supa.auth.getSession();
  if (session) {
    const { data: prof } = await supa.from('medicos').select('*').eq('id', session.user.id).single();
    if (prof) { user = { ...prof, id: session.user.id, _email: session.user.email }; showApp(); }
  }
}

/* ============================================================
