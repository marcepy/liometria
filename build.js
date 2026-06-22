// Genera js/env.js a partir de las variables de entorno de Vercel.
// Este archivo SÍ va al repositorio. js/env.js NO.
const fs = require('fs');

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_KEY || '';

if (!url || !key) {
  console.error('[build] SUPABASE_URL o SUPABASE_KEY no definidas. Revisá las Environment Variables en Vercel.');
  process.exit(1);
}

fs.writeFileSync('js/env.js', `window.ENV={SUPABASE_URL:'${url}',SUPABASE_KEY:'${key}'};`);
console.log('[build] js/env.js generado correctamente.');
