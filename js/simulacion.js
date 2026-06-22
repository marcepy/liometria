const SIM_POPULATION = {
  normal:  { AL:{m:23.50,s:0.50,lo:22.5,hi:24.5}, K1:{m:43.40,s:1.20,lo:41.0,hi:46.0},
             K2:{m:44.20,s:1.25,lo:41.5,hi:46.5}, ACD:{m:3.15,s:0.38,lo:2.4,hi:4.1},
             LT:{m:4.48,s:0.39,lo:3.5,hi:5.8},   WTW:{m:11.80,s:0.47,lo:10.5,hi:13.0},
             CCT:{m:545,s:35,lo:460,hi:640} },
  short:   { AL:{m:21.50,s:0.40,lo:19.5,hi:22.4}, K1:{m:45.50,s:1.50,lo:42.0,hi:49.0},
             K2:{m:46.30,s:1.55,lo:42.5,hi:49.5}, ACD:{m:2.75,s:0.30,lo:2.1,hi:3.5},
             LT:{m:4.90,s:0.45,lo:4.0,hi:6.2},   WTW:{m:11.40,s:0.50,lo:10.0,hi:12.5},
             CCT:{m:555,s:35,lo:470,hi:640} },
  long:    { AL:{m:26.50,s:0.80,lo:25.0,hi:30.0}, K1:{m:42.50,s:1.20,lo:39.5,hi:45.5},
             K2:{m:43.20,s:1.25,lo:40.0,hi:46.0}, ACD:{m:3.55,s:0.42,lo:2.8,hi:4.8},
             LT:{m:4.20,s:0.38,lo:3.2,hi:5.5},   WTW:{m:12.10,s:0.48,lo:11.0,hi:13.5},
             CCT:{m:540,s:35,lo:455,hi:635} },
  flat_k:  { AL:{m:23.80,s:0.60,lo:22.0,hi:25.5}, K1:{m:40.00,s:0.80,lo:38.5,hi:41.9},
             K2:{m:41.00,s:0.85,lo:39.0,hi:42.8}, ACD:{m:3.25,s:0.40,lo:2.5,hi:4.2},
             LT:{m:4.55,s:0.40,lo:3.6,hi:5.9},   WTW:{m:12.20,s:0.50,lo:11.0,hi:13.5},
             CCT:{m:548,s:35,lo:460,hi:640} },
  steep_k: { AL:{m:23.20,s:0.50,lo:21.5,hi:24.8}, K1:{m:46.50,s:0.80,lo:46.0,hi:50.0},
             K2:{m:47.50,s:0.85,lo:46.5,hi:51.0}, ACD:{m:3.05,s:0.35,lo:2.3,hi:3.9},
             LT:{m:4.45,s:0.38,lo:3.5,hi:5.7},   WTW:{m:11.50,s:0.45,lo:10.2,hi:12.8},
             CCT:{m:542,s:35,lo:455,hi:635} },
};

// MAE publicado por fórmula (mixto, ojos normales)
// Kane 2017, Melles 2018, Savini 2021, Kane 2021
const SIM_LIT = {
  Kane:    { MAE:0.286, pct50:84.1, gen:'5ª gen', src:'Kane 2021' },
  Barrett: { MAE:0.313, pct50:81.6, gen:'5ª gen', src:'Kane 2017 / Melles 2018' },
  EVO:     { MAE:0.300, pct50:82.8, gen:'5ª gen', src:'Savini 2021' },
  Haigis:  { MAE:0.365, pct50:75.8, gen:'4ª gen', src:'Kane 2017' },
  SRKT:    { MAE:0.390, pct50:72.1, gen:'3ª gen', src:'Kane 2017' },
  HofferQ: { MAE:0.380, pct50:73.5, gen:'3ª gen', src:'Kane 2017' },
  Holladay1:{ MAE:0.375, pct50:74.2, gen:'3ª gen', src:'Kane 2017' },
};

// Rangos fisiológicos esperados por categoría
const SIM_PHYS = {
  normal:  [14,30], short:[22,45], long:[0,22], flat_k:[12,32], steep_k:[14,30]
};

// LCG pseudo-random (seed para reproducibilidad)
function simRng(seed) {
  let s = seed || 42;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function simGauss(rng) {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function simClipped(rng, m, s, lo, hi) {
  for (let i = 0; i < 50; i++) {
    const v = m + simGauss(rng) * s;
    if (v >= lo && v <= hi) return Math.round(v * 1000) / 1000;
  }
  return m;
}

function generateSyntheticPop(cat, n, seed) {
  const p = SIM_POPULATION[cat];
  if (!p) return [];
  const rng = simRng(seed || 42);
  return Array.from({length: n}, (_, i) => {
    const K1  = simClipped(rng, p.K1.m,  p.K1.s,  p.K1.lo,  p.K1.hi);
    const K2  = simClipped(rng, p.K2.m,  p.K2.s,  p.K2.lo,  p.K2.hi);
    return {
      AL:  simClipped(rng, p.AL.m,  p.AL.s,  p.AL.lo,  p.AL.hi),
      K1, K2, Kaxis: 90,
      ACD: simClipped(rng, p.ACD.m, p.ACD.s, p.ACD.lo, p.ACD.hi),
      LT:  simClipped(rng, p.LT.m,  p.LT.s,  p.LT.lo,  p.LT.hi),
      WTW: simClipped(rng, p.WTW.m, p.WTW.s, p.WTW.lo, p.WTW.hi),
      CCT: simClipped(rng, p.CCT.m, p.CCT.s, p.CCT.lo, p.CCT.hi),
      A: 119.1, Sex: 'M', T: 0  // A-constant Alcon SN60WF
    };
  });
}

// Run all formulas on one eye with a given target
function simRunEye(d, targetSE, step) {
  const dT = {...d, T: targetSE};
  const fns = {
    Kane: calcKane, Barrett: calcBarrett, SRKT: calcSRKT,
    HofferQ: calcHofferQ, Holladay1: calcHolladay1,
    Haigis: calcHaigis, EVO: calcEVO,
  };
  const results = {};
  for (const [k, fn] of Object.entries(fns)) {
    const emm  = fn(dT);
    if (emm == null) { results[k] = null; continue; }
    const cont  = emm;  // vergencia() already applies target via alParaTarget()
    const rounded = Math.round(cont / step) * step;
    const elp   = getELP(k, dT);
    const se    = elp != null ? rxParaLIO(rounded, elp, d.AL, Km(d)) : null;
    results[k] = { emm, cont, rounded, se };
  }
  return results;
}

// Aggregate stats
function simStats(vals) {
  const v = vals.filter(x => x != null);
  if (!v.length) return null;
  const mean = v.reduce((a,b)=>a+b,0)/v.length;
  const sd   = Math.sqrt(v.reduce((a,b)=>a+(b-mean)**2,0)/Math.max(v.length-1,1));
  return { mean, sd, min: Math.min(...v), max: Math.max(...v), n: v.length };
}

let simChartBar = null, simChartSe = null;

function runSim() {
  const cat   = document.getElementById('simCat')?.value   || 'normal';
  const tgt   = parseFloat(document.getElementById('simTgt')?.value  || 0);
  const step  = parseFloat(document.getElementById('simStep')?.value || 0.5);
  const n     = parseInt(document.getElementById('simN')?.value      || 300);

  const pop = generateSyntheticPop(cat, n);
  const formulas = ['Kane','Barrett','EVO','Haigis','SRKT','HofferQ','Holladay1'];
  const agg = {};
  formulas.forEach(k => agg[k] = { powers:[], ses:[] });

  pop.forEach(d => {
    const res = simRunEye(d, tgt, step);
    formulas.forEach(k => {
      if (res[k]) {
        agg[k].powers.push(res[k].rounded);
        if (res[k].se != null) agg[k].ses.push(res[k].se);
      }
    });
  });

  const stats = {};
  formulas.forEach(k => {
    stats[k] = {
      power: simStats(agg[k].powers),
      se:    simStats(agg[k].ses),
    };
  });

  const phys = SIM_PHYS[cat] || [0, 50];

  // ── Metrics ───────────────────────────────────────────────────────────────
  const newer = ['Kane','Barrett','EVO'];
  const newerMeanSE = simStats(newer.flatMap(k => agg[k].ses));
  const within025 = formulas.filter(k => {
    const s = stats[k].se;
    return s && Math.abs(s.mean - tgt) <= 0.25;
  }).length;
  const bestF = formulas.reduce((a,b) =>
    (!stats[a].se || (stats[b].se && Math.abs(stats[b].se.mean-tgt) < Math.abs(stats[a].se.mean-tgt))) ? b : a
  );

  const mc = document.getElementById('simMetrics');
  if (mc) mc.innerHTML = `
    <div style="background:var(--bg2);border-radius:8px;padding:.6rem .8rem">
      <div style="font-size:11px;color:var(--text2);margin-bottom:2px">Ojos simulados</div>
      <div style="font-size:18px;font-weight:500">${pop.length.toLocaleString()}</div>
      <div style="font-size:10px;color:var(--text3)">${cat} · ${step}D escalón</div>
    </div>
    <div style="background:var(--bg2);border-radius:8px;padding:.6rem .8rem">
      <div style="font-size:11px;color:var(--text2);margin-bottom:2px">Mejor fórmula (SE más cercano)</div>
      <div style="font-size:18px;font-weight:500">${bestF}</div>
      <div style="font-size:10px;color:var(--text3)">SE medio ${stats[bestF].se?.mean!=null?(stats[bestF].se.mean>=0?'+':'')+stats[bestF].se.mean.toFixed(3):'—'} D</div>
    </div>
    <div style="background:var(--bg2);border-radius:8px;padding:.6rem .8rem">
      <div style="font-size:11px;color:var(--text2);margin-bottom:2px">Dentro ±0.25D del target</div>
      <div style="font-size:18px;font-weight:500">${within025}/${formulas.length}</div>
      <div style="font-size:10px;color:var(--text3)">fórmulas en rango</div>
    </div>
    <div style="background:var(--bg2);border-radius:8px;padding:.6rem .8rem">
      <div style="font-size:11px;color:var(--text2);margin-bottom:2px">MAE lit. Kane (5ª gen)</div>
      <div style="font-size:18px;font-weight:500">0.286 D</div>
      <div style="font-size:10px;color:var(--text3)">84.1% dentro ±0.50D</div>
    </div>`;

  // ── Bar chart ─────────────────────────────────────────────────────────────
  const colors = { Kane:'#7F77DD', Barrett:'#1D9E75', EVO:'#378ADD',
                   Haigis:'#888780', SRKT:'#B4B2A9', HofferQ:'#D3D1C7', Holladay1:'#5F5E5A' };

  const bcEl = document.getElementById('simBarChart');
  if (bcEl) {
    if (simChartBar) simChartBar.destroy();
    bcEl.style.height = '240px';
    simChartBar = new Chart(bcEl, {
      type: 'bar',
      data: {
        labels: formulas,
        datasets: [{
          label: 'Potencia media (D)',
          data: formulas.map(k => stats[k].power ? +stats[k].power.mean.toFixed(2) : null),
          backgroundColor: formulas.map(k => colors[k]),
          borderWidth: 0, borderRadius: 4,
          error: formulas.map(k => stats[k].power ? +stats[k].power.sd.toFixed(2) : 0),
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display:false },
          tooltip: { callbacks: { label: ctx => {
            const k = formulas[ctx.dataIndex];
            const s = stats[k].power;
            return s ? `${ctx.parsed.y.toFixed(2)} D ± ${s.sd.toFixed(2)}` : '—';
          }}}
        },
        scales: {
          x: { ticks:{font:{size:11}}, grid:{display:false} },
          y: { title:{display:true,text:'IOL power (D)',font:{size:11}}, ticks:{font:{size:11}} }
        }
      }
    });
  }

  // ── SE delta chart ─────────────────────────────────────────────────────────
  const seEl = document.getElementById('simSeChart');
  if (seEl) {
    if (simChartSe) simChartSe.destroy();
    seEl.style.height = '200px';
    const deltas = formulas.map(k => stats[k].se ? +(stats[k].se.mean - tgt).toFixed(3) : null);
    const seColors = formulas.map((k,i) => {
      const d = deltas[i];
      if (d == null) return '#ccc';
      return Math.abs(d) <= 0.25 ? '#1D9E75' : Math.abs(d) <= 0.50 ? '#EF9F27' : '#E24B4A';
    });
    simChartSe = new Chart(seEl, {
      type: 'bar',
      data: {
        labels: formulas,
        datasets: [{ label: 'Δ SE (D)', data: deltas, backgroundColor: seColors,
                     borderWidth:0, borderRadius:3 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{display:false},
          tooltip: { callbacks: { label: ctx => {
            const k = formulas[ctx.dataIndex];
            const s = stats[k].se;
            return s ? `SE medio ${s.mean>=0?'+':''}${s.mean.toFixed(3)} D (Δ${ctx.parsed.y>=0?'+':''}${ctx.parsed.y.toFixed(3)} D del objetivo)` : '—';
          }}}
        },
        scales: {
          x: { ticks:{font:{size:11}}, grid:{display:false} },
          y: { title:{display:true,text:'Δ SE (D) vs objetivo',font:{size:11}},
               ticks:{font:{size:11}}, min:-0.75, max:0.75 }
        }
      }
    });
  }

  // ── Table ──────────────────────────────────────────────────────────────────
  const tbody = document.getElementById('simTableBody');
  if (tbody) {
    tbody.innerHTML = formulas.map(k => {
      const ps = stats[k].power, ss = stats[k].se;
      const lit = SIM_LIT[k] || {};
      const seMean = ss ? ss.mean : null;
      const physOk = ps && ps.mean >= phys[0] && ps.mean <= phys[1];
      const physBadge = physOk
        ? '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:var(--bg-success,#EAF3DE);color:var(--text-success,#27500A)">✓ OK</span>'
        : '<span style="font-size:10px;padding:1px 6px;border-radius:4px;background:#FAEEDA;color:#633806">Revisar</span>';
      const newer3 = ['Kane','Barrett','EVO'].includes(k);
      const tdStyle = newer3 ? 'color:var(--blue,#378ADD);font-weight:500' : '';
      return `<tr style="border-bottom:.5px solid var(--border)">
        <td style="padding:5px 8px;${tdStyle}">${k === 'Barrett' ? 'Barrett II' : k === 'SRKT' ? 'SRK/T' : k === 'HofferQ' ? 'Hoffer Q' : k}</td>
        <td style="padding:5px 8px;font-size:11px;color:var(--text2)">${lit.gen||'—'}</td>
        <td style="padding:5px 8px;text-align:right">${ps ? ps.mean.toFixed(2) : '—'}</td>
        <td style="padding:5px 8px;text-align:right;color:var(--text2)">±${ps ? ps.sd.toFixed(2) : '—'}</td>
        <td style="padding:5px 8px;text-align:right;font-weight:500;color:${seMean!=null&&Math.abs(seMean-tgt)<=0.25?'var(--green,#1D9E75)':seMean!=null&&Math.abs(seMean-tgt)<=0.5?'':''}">${seMean!=null?(seMean>=0?'+':'')+seMean.toFixed(3):'—'} D</td>
        <td style="padding:5px 8px;text-align:right">${lit.MAE?.toFixed(3)||'—'}</td>
        <td style="padding:5px 8px;text-align:right">${lit.pct50?.toFixed(1)||'—'}%</td>
        <td style="padding:5px 8px;text-align:center">${physBadge}</td>
      </tr>`;
    }).join('');
  }
}

function renderSimTab() {
  // Load Chart.js if not already loaded
  if (typeof Chart === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    s.onload = () => runSim();
    document.head.appendChild(s);
  } else {
    runSim();
  }
}

