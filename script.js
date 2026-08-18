/* ============================================================
   Dashboard de Reparaciones — Philo VLP
   Carga los datos desde data/datos.json mediante fetch().
   IMPORTANTE: debe servirse por HTTP (GitHub Pages, o un
   servidor local tipo `python -m http.server`). Abrir este
   proyecto con doble clic (protocolo file://) hace que el
   navegador bloquee fetch() por política CORS — eso es un
   comportamiento normal del navegador, no un error del código.
   ============================================================ */

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#8993A8';
Chart.defaults.borderColor = '#232A38';
const CYAN='#33D6C0', AMBER='#F5B942', RED='#F0616D', BLUE='#5B9DF9', VIOLET='#A38BFA', MUTED='#8993A8';
const PALETTE=[CYAN,BLUE,VIOLET,AMBER,RED,'#4ADE80','#F472B6','#60A5FA'];

function fmt(n){ return new Intl.NumberFormat('es-MX').format(n); }

/* ---------- Carga de datos ---------- */
const DATA_URL = 'data/datos.json';

document.addEventListener('DOMContentLoaded', () => {
  fetch(DATA_URL)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} al solicitar ${DATA_URL}`);
      }
      return res.json();
    })
    .then(data => {
      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        throw new Error('El archivo de datos está vacío o no tiene el formato esperado.');
      }
      hideLoader();
      renderDashboard(data);
    })
    .catch(err => {
      console.error('Error cargando el dashboard:', err);
      showError(err);
    });
});

function hideLoader() {
  const loader = document.getElementById('loadingBanner');
  if (loader) loader.style.display = 'none';
}

function showError(err) {
  const loader = document.getElementById('loadingBanner');
  const box = document.getElementById('errorBanner');
  if (loader) loader.style.display = 'none';
  if (box) {
    box.style.display = 'block';
    box.querySelector('.error-detail').textContent = err.message || String(err);
  }
}

/* ---------- Render principal ---------- */
function renderDashboard(DATA) {

  // ---------- HEADER / KPIs ----------
  document.getElementById('dateRangeLbl').textContent = DATA.kpis.date_min + ' → ' + DATA.kpis.date_max;
  document.getElementById('flowA').textContent = fmt(DATA.kpis.unique_units_intake);
  document.getElementById('flowB').textContent = fmt(DATA.kpis.unique_units_detail);
  document.getElementById('flowC').textContent = fmt(DATA.kpis.unique_units_common);
  document.getElementById('flowCPct').textContent = Math.round(100*DATA.kpis.unique_units_common/DATA.kpis.unique_units_intake) + '% del archivo A';
  document.getElementById('kpi1').textContent = fmt(DATA.kpis.total_repair_events_intake);
  document.getElementById('kpi2').textContent = fmt(DATA.kpis.total_repair_events_detail);
  document.getElementById('kpi3').textContent = fmt(DATA.kpis.unique_units_total);
  document.getElementById('kpi4').textContent = DATA.kpis.avg_aging_days + 'd';
  document.getElementById('kpi5').textContent = DATA.kpis.avg_repair_count;
  document.getElementById('kpi5b').textContent = DATA.kpis.max_repair_count;
  document.getElementById('kpi6').textContent = DATA.kpis.scrap_rate_detail_pct + '%';
  document.getElementById('mergeFooter').textContent =
    `SN solo en A: ${fmt(DATA.merge_summary.sn_only_in_intake)} · SN solo en B: ${fmt(DATA.merge_summary.sn_only_in_detail)} · SN en ambos: ${fmt(DATA.merge_summary.sn_common)}`;

  // ---------- 1. TREND ----------
  let trendChart;
  function renderTrend(filter){
    const ctx = document.getElementById('chartTrend');
    const months = DATA.trend_monthly.months;
    const series = DATA.trend_monthly.series;
    let datasets;
    if(filter==='all'){
      datasets = Object.keys(series).map((k,i)=>({
        label:k, data:series[k], borderColor:PALETTE[i], backgroundColor:PALETTE[i]+'22',
        tension:.35, fill:false, pointRadius:3, borderWidth:2.5
      }));
    } else {
      datasets = [{label:filter, data:series[filter], borderColor:CYAN, backgroundColor:CYAN+'33', tension:.35, fill:true, pointRadius:4, borderWidth:2.5}];
    }
    if(trendChart) trendChart.destroy();
    trendChart = new Chart(ctx, {
      type:'line',
      data:{labels:months, datasets},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{position:'top', labels:{boxWidth:10, font:{size:11}}}},
        scales:{
          x:{grid:{display:false}},
          y:{grid:{color:'#1A202C'}, beginAtZero:true}
        }
      }
    });
  }
  renderTrend('all');
  document.querySelectorAll('.chip[data-shift]').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      document.querySelectorAll('.chip[data-shift]').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      renderTrend(chip.dataset.shift);
    });
  });
  const shiftKeys = Object.keys(DATA.trend_monthly.series);
  if (shiftKeys.includes('Turno 1') && shiftKeys.includes('Turno 3')) {
    const t1 = DATA.trend_monthly.series['Turno 1'].reduce((a,b)=>a+b,0);
    const t2 = (DATA.trend_monthly.series['Turno 2']||[]).reduce((a,b)=>a+b,0);
    const t3 = DATA.trend_monthly.series['Turno 3'].reduce((a,b)=>a+b,0);
    document.getElementById('insightTrend').innerHTML = `<b>Turno 1</b> concentra consistentemente el mayor volumen de intakes (${Math.round(100*t1/(t1+t2+t3))}% del total), casi el doble que Turno 3 en cada mes.`;
  }

  // ---------- Weekly ----------
  new Chart(document.getElementById('chartWeekly'), {
    type:'bar',
    data:{labels:DATA.trend_weekly_detail.weeks, datasets:[{data:DATA.trend_weekly_detail.counts, backgroundColor:BLUE+'99', borderRadius:2, barPercentage:1, categoryPercentage:1}]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{x:{display:false}, y:{grid:{color:'#1A202C'}}}
    }
  });

  // ---------- 2. Pareto ----------
  new Chart(document.getElementById('chartPareto'), {
    data:{
      labels:DATA.defect_pareto.map(d=>d.defect),
      datasets:[
        {type:'bar', label:'Eventos', data:DATA.defect_pareto.map(d=>d.count), backgroundColor:CYAN+'CC', borderRadius:3, yAxisID:'y'},
        {type:'line', label:'% Acumulado', data:DATA.defect_pareto.map(d=>d.cum_pct), borderColor:AMBER, backgroundColor:AMBER, tension:.3, yAxisID:'y1', pointRadius:3, borderWidth:2}
      ]
    },
    options:{
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top', labels:{boxWidth:10,font:{size:11}}}},
      scales:{
        y:{grid:{display:false}, ticks:{font:{size:10.5}}},
        y1:{position:'top', min:0, max:100, grid:{display:false}, ticks:{callback:v=>v+'%'}},
        x:{grid:{color:'#1A202C'}}
      }
    }
  });
  if (DATA.defect_pareto[3]) {
    document.getElementById('insightPareto').innerHTML = `Los primeros <b>4 defectos</b> (${DATA.defect_pareto.slice(0,4).map(d=>d.defect).join(', ')}) representan el <b>${DATA.defect_pareto[3].cum_pct}%</b> de todos los eventos — un foco claro para reducción de fallas.`;
  }

  // ---------- Shift defect ----------
  new Chart(document.getElementById('chartShiftDefect'), {
    type:'bar',
    data:{
      labels:DATA.shift_defect.defects,
      datasets:Object.keys(DATA.shift_defect.series).map((k,i)=>({label:k, data:DATA.shift_defect.series[k], backgroundColor:PALETTE[i], borderRadius:3}))
    },
    options:{
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top', labels:{boxWidth:10,font:{size:11}}}},
      scales:{x:{stacked:true, grid:{color:'#1A202C'}}, y:{stacked:true, grid:{display:false}, ticks:{font:{size:10.5}}}}
    }
  });

  // ---------- 3. Repair count vs outcome ----------
  new Chart(document.getElementById('chartRCOutcome'), {
    type:'line',
    data:{
      labels:DATA.repair_count_vs_outcome.buckets,
      datasets:[
        {label:'% Scrap', data:DATA.repair_count_vs_outcome.scrap_pct, borderColor:RED, backgroundColor:RED+'33', fill:true, tension:.3, borderWidth:3, pointRadius:4},
        {label:'% Fail', data:DATA.repair_count_vs_outcome.fail_pct, borderColor:AMBER, backgroundColor:AMBER+'22', fill:true, tension:.3, borderWidth:3, pointRadius:4}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top', labels:{boxWidth:10,font:{size:11}}}},
      scales:{
        x:{title:{display:true, text:'Número de reparaciones (Repair Count)', font:{size:11}}, grid:{display:false}},
        y:{title:{display:true, text:'% de unidades', font:{size:11}}, grid:{color:'#1A202C'}}
      }
    }
  });

  // RC volume
  new Chart(document.getElementById('chartRCVolume'), {
    type:'bar',
    data:{labels:DATA.repair_count_vs_outcome.buckets, datasets:[{data:DATA.repair_count_vs_outcome.total, backgroundColor:VIOLET+'CC', borderRadius:4}]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{x:{grid:{display:false}, title:{display:true,text:'Repair Count', font:{size:11}}}, y:{grid:{color:'#1A202C'}}}
    }
  });

  // Test generation
  new Chart(document.getElementById('chartGen'), {
    type:'bar',
    data:{labels:Object.keys(DATA.test_generation_dist), datasets:[{data:Object.values(DATA.test_generation_dist), backgroundColor:BLUE+'CC', borderRadius:4}]},
    options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}}, y:{grid:{color:'#1A202C'}}}}
  });

  // Outcome donut
  new Chart(document.getElementById('chartOutcome'), {
    type:'doughnut',
    data:{labels:Object.keys(DATA.outcome_distribution), datasets:[{data:Object.values(DATA.outcome_distribution), backgroundColor:[CYAN,MUTED,AMBER,RED], borderColor:'#12161F', borderWidth:3}]},
    options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{boxWidth:10, font:{size:10.5}}}}, cutout:'62%'}
  });

  // Rework donut
  const reworkLabels = Object.keys(DATA.rework_action_dist).slice(0,6);
  const reworkVals = reworkLabels.map(k=>DATA.rework_action_dist[k]);
  new Chart(document.getElementById('chartRework'), {
    type:'doughnut',
    data:{labels:reworkLabels.map(l=>l.replace('RWK ','')), datasets:[{data:reworkVals, backgroundColor:PALETTE, borderColor:'#12161F', borderWidth:3}]},
    options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{boxWidth:10, font:{size:9.5}}}}, cutout:'62%'}
  });

  // ---------- 4. Stations ----------
  new Chart(document.getElementById('chartFailStation'), {
    type:'bar',
    data:{labels:DATA.failure_station_top.map(d=>d.station), datasets:[{data:DATA.failure_station_top.map(d=>d.count), backgroundColor:AMBER+'CC', borderRadius:3}]},
    options:{indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{grid:{display:false}, ticks:{font:{size:10}}}, x:{grid:{color:'#1A202C'}}}}
  });
  new Chart(document.getElementById('chartRepairStation'), {
    type:'bar',
    data:{labels:DATA.repair_station_top.map(d=>d.station), datasets:[{data:DATA.repair_station_top.map(d=>d.count), backgroundColor:CYAN+'CC', borderRadius:3}]},
    options:{indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{grid:{display:false}, ticks:{font:{size:10}}}, x:{grid:{color:'#1A202C'}}}}
  });

  // ---------- 5. Part number table ----------
  const tblParts = document.getElementById('tblParts');
  DATA.part_number_stats.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="font-family:var(--mono); font-size:11.5px;">${p.part}</td><td>${fmt(p.defect_events)}</td><td>${fmt(p.unique_units)}</td><td>${p.avg_repair_count}</td>
    <td><span class="badge ${p.scrap_rate_pct>0.7?'Scrap':(p.scrap_rate_pct>0.2?'Fail':'Pass')}">${p.scrap_rate_pct}%</span></td>`;
    tblParts.appendChild(tr);
  });
  if (DATA.part_number_stats.length) {
    const worstPart = DATA.part_number_stats.reduce((a,b)=> a.avg_repair_count>b.avg_repair_count?a:b);
    const bestScrapPart = DATA.part_number_stats.reduce((a,b)=> a.scrap_rate_pct<b.scrap_rate_pct?a:b);
    document.getElementById('insightParts').innerHTML = `<b>${worstPart.part}</b> tiene el mayor Repair Count promedio (${worstPart.avg_repair_count}) del top — indicativo de un problema de diseño o proceso recurrente en ese número de parte. En contraste, partes como <b>${bestScrapPart.part}</b> mantienen la menor tasa de scrap pese a alto volumen.`;
  }

  // ---------- 6. Aging + Employee ----------
  new Chart(document.getElementById('chartAging'), {
    type:'bar',
    data:{labels:DATA.aging_by_defect.map(d=>d.defect), datasets:[{data:DATA.aging_by_defect.map(d=>d.avg_aging), backgroundColor:RED+'AA', borderRadius:3}]},
    options:{indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{grid:{display:false}, ticks:{font:{size:10.5}}}, x:{grid:{color:'#1A202C'}, title:{display:true,text:'días', font:{size:10}}}}}
  });

  new Chart(document.getElementById('chartEmployee'), {
    type:'bar',
    data:{
      labels:DATA.employee_top.map(d=>d.employee),
      datasets:[
        {label:'Eventos', data:DATA.employee_top.map(d=>d.events), backgroundColor:VIOLET+'CC', borderRadius:3},
        {label:'Unidades únicas', data:DATA.employee_top.map(d=>d.units), backgroundColor:CYAN+'CC', borderRadius:3}
      ]
    },
    options:{indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'top', labels:{boxWidth:10,font:{size:11}}}}, scales:{y:{grid:{display:false}, ticks:{font:{size:9.5}}}, x:{grid:{color:'#1A202C'}}}}
  });

  // ---------- 7. Top problem units table ----------
  const tblUnits = document.getElementById('tblUnits');
  function renderUnits(filterText){
    tblUnits.innerHTML = '';
    const f = (filterText||'').toUpperCase();
    DATA.top_problem_units.filter(u => u.sn.toUpperCase().includes(f) || u.part.toUpperCase().includes(f)).forEach(u=>{
      const badgeClass = u.final_state.startsWith('Otro') ? 'Otro' : u.final_state;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="font-family:var(--mono); font-size:11.5px;">${u.sn}</td>
        <td style="font-family:var(--mono); font-size:11px; color:var(--muted);">${u.part}</td>
        <td>${u.intake_events}</td><td>${u.detail_events}</td>
        <td style="font-weight:700; color:${u.max_repair_count>=35?'#F0616D':'#F5B942'}">${u.max_repair_count}</td>
        <td>${u.distinct_defects}</td><td>${u.avg_aging}d</td>
        <td><span class="badge ${badgeClass}" style="${badgeClass==='Otro'?'background:rgba(139,147,168,.15);color:#8993A8;':''}">${u.final_state}</span></td>`;
      tblUnits.appendChild(tr);
    });
  }
  renderUnits('');
  document.getElementById('unitSearch').addEventListener('input', e=>renderUnits(e.target.value));

}
