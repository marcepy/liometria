async function renderResults() {
  const sumEl  = document.getElementById('resultSummary');
  const listEl = document.getElementById('resultList');
  if (!sumEl || !user) return;
  sumEl.innerHTML  = '<div class="loading"><div class="spinner"></div> Cargando...</div>';
  listEl.innerHTML = '';

  const { data, error } = await supa.from('calculos')
    .select('*').eq('medico_id', user.id)
    .or('postop_od.not.is.null,postop_oi.not.is.null')
    .order('created_at', { ascending: false }).limit(200);

  if (error) { sumEl.innerHTML = '<p style="color:#993C1D;font-size:12px">Error al cargar.</p>'; return; }
  if (!data?.length) {
    sumEl.innerHTML = `<div class="warn-box">
      <i class="ti ti-info-circle" style="font-size:12px;vertical-align:-1px"></i>
      Aún no hay casos con refracción postop registrada. Andá a <strong>Historial</strong> y usá el botón <em>Registrar postop</em> en cada caso.
    </div>`;
    return;
  }

  // ── Calcular estadísticas por fórmula ──────────────────────
  const stats = {};   // { formula: { errors:[], n:0 } }
  data.forEach(h => {
    ['postop_od','postop_oi'].forEach(key => {
      const po = h[key];
      if (!po?.errors) return;
      Object.entries(po.errors).forEach(([f, err]) => {
        if (!stats[f]) stats[f] = { errors: [] };
        stats[f].errors.push(err);
      });
    });
  });

  // ── Tabla de resumen ───────────────────────────────────────
  const formulaRows = Object.entries(stats)
    .map(([f, s]) => {
      const n = s.errors.length;
      const mae  = s.errors.reduce((a,e) => a + Math.abs(e), 0) / n;
      const me   = s.errors.reduce((a,e) => a + e, 0) / n;
      const p050 = s.errors.filter(e => Math.abs(e) <= 0.50).length / n * 100;
      const p025 = s.errors.filter(e => Math.abs(e) <= 0.25).length / n * 100;
      return { f, n, mae, me, p025, p050 };
    })
    .sort((a,b) => a.mae - b.mae);

  const bestMAE = formulaRows[0]?.mae || 1;
  const tableRows = formulaRows.map((r,i) => {
    const barW = Math.round((r.mae / (bestMAE * 1.6)) * 80);
    const barColor = i === 0 ? '#27500A' : r.mae < 0.40 ? '#378ADD' : '#EF9F27';
    const meSign = r.me >= 0 ? '+' : '';
    return `<tr>
      <td><strong>${FL[r.f] || r.f}</strong>${i===0?' <span class="badge b-rec" style="margin-left:4px">Mejor</span>':''}</td>
      <td style="text-align:right">${r.n}</td>
      <td style="text-align:right;font-weight:600">${r.mae.toFixed(3)} D
        <span class="err-bar-wrap"><span class="err-bar" style="width:${barW}px;background:${barColor}"></span></span>
      </td>
      <td style="text-align:right;color:${Math.abs(r.me)>0.15?'#993C1D':'var(--text2)'};">${meSign}${r.me.toFixed(3)} D</td>
      <td style="text-align:right">${r.p025.toFixed(0)}%</td>
      <td style="text-align:right">${r.p050.toFixed(0)}%</td>
    </tr>`;
  }).join('');

  const totalCases = data.length;
  const totalEyes  = data.reduce((a,h) => a + (h.postop_od?1:0) + (h.postop_oi?1:0), 0);

  sumEl.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
      <div class="metric" style="min-width:80px"><div class="lbl">Casos</div><div class="val">${totalCases}</div></div>
      <div class="metric" style="min-width:80px"><div class="lbl">Ojos</div><div class="val">${totalEyes}</div></div>
      <div class="metric" style="min-width:80px"><div class="lbl">Para PEARL</div><div class="val">${totalEyes >= 200 ? '✓ Listo' : totalEyes + '/200'}</div></div>
    </div>
    ${totalEyes < 200 ? `<div class="warn-box" style="margin-bottom:10px"><i class="ti ti-info-circle" style="font-size:12px;vertical-align:-1px"></i> Necesitás <strong>${200 - totalEyes} ojos más</strong> para reentrenar PEARL-DGS con tus propios datos.</div>` : '<div class="ai-box" style="margin-bottom:10px"><p><i class="ti ti-sparkles" style="font-size:11px"></i> <strong>¡Dataset suficiente para reentrenamiento!</strong> Exportá el CSV y correlo en el notebook PEARL-DGS.</p></div>'}
    <table class="err-table">
      <thead><tr>
        <th>Fórmula</th><th style="text-align:right">N</th>
        <th style="text-align:right">MAE</th>
        <th style="text-align:right">Error medio</th>
        <th style="text-align:right">±0.25D</th>
        <th style="text-align:right">±0.50D</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>`;

  // ── Lista de casos ─────────────────────────────────────────
  listEl.innerHTML = data.map(h => {
    const eyes = [
      h.postop_od ? { eye:'OD', po:h.postop_od, bio:h.datos_od } : null,
      h.postop_oi ? { eye:'OI', po:h.postop_oi, bio:h.datos_oi } : null,
    ].filter(Boolean);
    const eyeChips = eyes.map(({eye, po}) => {
      const se = po.se != null ? (po.se >= 0 ? '+' : '') + po.se.toFixed(2) + 'D' : '?';
      const color = eye === 'OD' ? 'var(--green)' : 'var(--orange)';
      const bestErr = po.errors ? Object.values(po.errors).reduce((b,e) => Math.abs(e) < Math.abs(b) ? e : b, Infinity) : null;
      const errStr = bestErr != null && isFinite(bestErr)
        ? ` · PE ${bestErr >= 0 ? '+' : ''}${bestErr.toFixed(2)}D` : '';
      return `<span style="font-size:11px;color:${color};font-weight:600">${eye} SE ${se}${errStr}</span>`;
    }).join(' &nbsp;|&nbsp; ');
    const selFormulas = (h.selected_formulas || []).map(f =>
      `<span style="font-size:10px;color:var(--text3);background:var(--bg3);border:.5px solid var(--border);
        border-radius:20px;padding:1px 7px;margin-right:3px">${FL[f]||f}</span>`
    ).join('');
    const iolStr = [h.iol_brand, h.iol_model].filter(Boolean).join(' ') || '—';
    return `<div style="border:.5px solid var(--border);border-radius:var(--radius);padding:9px 12px;margin-bottom:6px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px;">
        <div style="flex:1;min-width:0;">
          <p style="font-size:12px;font-weight:600;">${h.paciente_nombre||'Paciente'} ${h.paciente_hc?'· '+h.paciente_hc:''}</p>
          <p style="font-size:11px;color:var(--text2);margin-top:2px;">
            ${new Date(h.created_at).toLocaleDateString('es-PY',{day:'2-digit',month:'short',year:'numeric'})}
            &nbsp;·&nbsp; ${eyeChips}
          </p>
          <p style="font-size:10px;color:var(--text3);margin-top:3px;">
            LIO: <strong>${iolStr}</strong>
            &nbsp;·&nbsp; ${selFormulas || '<span style="font-size:10px;color:var(--text3)">sin fórmulas registradas</span>'}
          </p>
        </div>
        <button onclick="openPostopModal(${h.id})" class="btn btn-s" style="font-size:11px;padding:5px 12px;flex-shrink:0;">
          <i class="ti ti-edit" style="font-size:12px"></i> Editar
        </button>
      </div>
    </div>`;
  }).join('');
}

/* ── Export CSV para notebook PEARL-DGS ── */
async function exportPostopCSV() {
  if (!user) return;
  const { data, error } = await supa.from('calculos')
    .select('*').eq('medico_id', user.id)
    .or('postop_od.not.is.null,postop_oi.not.is.null')
    .order('created_at', { ascending: false }).limit(2000);
  if (error || !data?.length) { notify('No hay datos postop para exportar.', 'error'); return; }

  // Formato columnas del notebook PEARL-DGS
  const header = ['id','eye','AL','K1','K2','ARC','ACD','LT','CCT','WTW','A','T','SE_postop','sph','cyl','axis','va','date_postop','iol_brand','iol_model','calc_date'];
  const rows = [];
  data.forEach(h => {
    ['OD','OI'].forEach(eye => {
      const bio = eye === 'OD' ? h.datos_od : h.datos_oi;
      const po  = eye === 'OD' ? h.postop_od : h.postop_oi;
      if (!bio?.AL || !po?.se != null) return;
      if (po.se == null) return;
      const ARC = bio.K1 && bio.K2 ? Math.sqrt((0.3375/bio.K1)*(0.3375/bio.K2)).toFixed(5) : '';
      rows.push([
        h.id, eye,
        bio.AL||'', bio.K1||'', bio.K2||'', ARC,
        bio.ACD||'', bio.LT||'', bio.CCT||'', bio.WTW||'',
        bio.A||'', bio.T||0,
        po.se, po.sph||'', po.cyl||'', po.axis||'', po.va||'',
        po.date||'', h.iol_brand||'', h.iol_model||'',
        new Date(h.created_at).toISOString().slice(0,10)
      ].join(','));
    });
  });

  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `liometria_postop_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  notify(`CSV exportado · ${rows.length} ojos`);
}


/* ============================================================
   SIMULACIÓN — motor JS usando las fórmulas existentes de la app
   Biometría sintética + validación vs literatura publicada
   ============================================================ */

