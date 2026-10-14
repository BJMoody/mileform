import { BRAND, DEMO_PROFILE, EVENTS, PHASES, SCIENCE, WORKOUTS } from './data.js';
import {
  auditWeek, currentEquivalent, eventById, findWeek, formatDate, formatPace, formatTime,
  generatePlan, goalAssessment, matchActivityToSession, rescheduleMissed,
  suggestedSupplement, todayISO, trainingZones
} from './engine.js';
import { parseActivityFile } from './fit.js';

const KEY = 'mileform-state-v1';
const MILE_M = 1609.344;
let state = loadState();
let plan = generatePlan(state.profile);
let weekIndex = Math.max(0, plan.weeks.findIndex(w => todayISO() >= w.start && todayISO() <= w.end));
let activity = null;
let activityMatch = null;
let query = '';
let auditResult = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.profile) {
      saved.profile.trainingStyle ||= 'standard';
      saved.completed ||= {};
      return saved;
    }
  } catch {}
  return { profile: structuredClone(DEMO_PROFILE), completed: {} };
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function rebuild() { plan = generatePlan(state.profile); weekIndex = Math.min(weekIndex, Math.max(0, plan.weeks.length - 1)); save(); }
function esc(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function pathRoute() { const p = location.pathname.replace(/^\/app\/?/, '').split('/')[0]; return ['plan','analyze','library','audit','science','profile'].includes(p) ? p : 'dashboard'; }
function go(r) { history.pushState({}, '', `/app/${r === 'dashboard' ? '' : r}`); render(); }
window.addEventListener('popstate', render);

document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) return go(nav.dataset.nav);
  const act = e.target.closest('[data-action]');
  if (!act) return;
  if (act.dataset.action === 'prev') { weekIndex = Math.max(0, weekIndex - 1); render(); }
  if (act.dataset.action === 'next') { weekIndex = Math.min(plan.weeks.length - 1, weekIndex + 1); render(); }
  if (act.dataset.action === 'complete') {
    state.completed[act.dataset.key] = !state.completed[act.dataset.key]; save(); render();
  }
  if (act.dataset.action === 'miss') {
    plan = rescheduleMissed(plan, weekIndex, act.dataset.id, state.profile); render();
  }
  if (act.dataset.action === 'reset') {
    state = { profile: structuredClone(DEMO_PROFILE), completed: {} }; rebuild(); render();
  }
});

document.addEventListener('input', e => {
  if (e.target.matches('[data-search]')) { query = e.target.value.toLowerCase(); renderView(); }
});

function shell(view) {
  const r = pathRoute();
  const nav = [['dashboard','⌁'],['plan','▦'],['analyze','↥'],['library','▤'],['audit','✓'],['science','◫'],['profile','◉']];
  return `<div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="mark"><span>MF</span></div><span class="brand-name">${BRAND.name}</span></div>
      <div class="nav-group">${nav.map(([k,i]) => `<button class="nav-button ${r===k?'active':''}" data-nav="${k}"><span class="nav-icon">${i}</span><span class="nav-label">${label(k)}</span></button>`).join('')}</div>
      <div class="sidebar-foot"><div class="small">Goal</div><strong>${eventById(state.profile.goal.eventId).label} · ${formatTime(state.profile.goal.seconds,true)}</strong><div class="goal-mini"><span>${formatDate(state.profile.goal.date,{month:'short',day:'numeric'})}</span><b>${goalAssessment(state.profile).label}</b></div></div>
    </aside>
    <main class="main"><header class="topbar"><div class="topbar-left"><span class="eyebrow">${label(r)}</span><span class="topbar-title">${BRAND.tagline}</span></div><div class="top-actions"><span class="pill">Deterministic · no AI</span><span class="avatar">${esc((state.profile.name||'A')[0])}</span></div></header><section id="view">${view}</section></main>
    <nav class="mobile-nav">${nav.slice(0,5).map(([k,i]) => `<button class="${r===k?'active':''}" data-nav="${k}"><b>${i}</b>${label(k)}</button>`).join('')}</nav>
  </div>`;
}
function label(r) { return ({dashboard:'Dashboard',plan:'Plan',analyze:'Analyze',library:'Library',audit:'Plan Audit',science:'Science',profile:'Profile'})[r]; }
function render() { document.title = `${label(pathRoute())} — ${BRAND.name}`; document.getElementById('app').innerHTML = shell(viewFor(pathRoute())); bind(); }
function renderView() { const el = document.getElementById('view'); if (el) { el.innerHTML = viewFor(pathRoute()); bind(); } }
function viewFor(r) { return ({plan:planView,analyze:analyzeView,library:libraryView,audit:auditView,science:scienceView,profile:profileView}[r] || dashboardView)(); }

function hero(kicker,title,text,actions='') { return `<div class="hero"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${text}</p></div>${actions?`<div class="hero-actions">${actions}</div>`:''}</div>`; }
function dashboardView() {
  const p = state.profile, a = goalAssessment(p), week = findWeek(plan, todayISO());
  const progress = Math.min(100, Math.round(p.goal.seconds / a.current * 100));
  const preds = [800,1609.344,3200,5000].map(d => ({d,t:currentEquivalent(p,d)}));
  return `<div class="content">${hero(`Welcome, ${esc(p.name)}`,'Your race has a build.','PRs + goal + calendar + actual training become one season model.',`<button class="btn primary" data-nav="plan">Open plan →</button><button class="btn" data-nav="analyze">Upload run</button>`)}
    <div class="grid grid-3">
      <div class="card goal-card"><div class="ring" style="--p:${progress}"><div class="ring-inner"><b>${progress}%</b><span>to goal</span></div></div><div><div class="metric-label">Goal</div><div class="metric">${formatTime(p.goal.seconds,true)}</div><div class="metric-foot">${eventById(p.goal.eventId).label} · ${formatDate(p.goal.date,{month:'short',day:'numeric',year:'numeric'})}</div><div class="goal-row"><div class="goal-stat"><span>Current eq.</span><b>${formatTime(a.current,true)}</b></div><div class="goal-stat"><span>Runway</span><b>${Math.round(a.weeks)} wk</b></div></div></div></div>
      <div class="card"><div class="metric-label">This week</div><div class="metric smaller">${week?.mileage||0}<span style="font-size:16px;color:var(--muted)"> mi</span></div><div class="metric-foot">${week?.phaseLabel||'—'} · ${week?.races.length||0} race(s)</div></div>
      <div class="card"><div class="metric-label">Training style</div><div class="metric smaller">${p.trainingStyle==='double-threshold'?'Double T':'Standard'}</div><div class="metric-foot">${week?.doubleThreshold?.reason||'Normal quality spacing.'}</div></div>
    </div>
    <div style="height:16px"></div>
    <div class="card"><div class="card-header"><div><div class="card-title">Performance equivalents</div><div class="card-sub">Current-fit equivalents from your PR curve</div></div></div><div class="pred-grid">${preds.map(x=>`<div class="prediction"><div class="dist">${x.d===5000?'5K':Math.abs(x.d-1609.344)<5?'Mile':Math.round(x.d)+'m'}</div><div class="time">${formatTime(x.t,x.d<=1609.344)}</div><div class="pace">${formatPace(x.t/x.d*MILE_M)}</div></div>`).join('')}</div></div>
  </div>`;
}

function planView() {
  const w = plan.weeks[weekIndex]; if (!w) return `<div class="content"><div class="empty">Update your goal date.</div></div>`;
  const zones = trainingZones(state.profile);
  return `<div class="content">${hero('Season plan','Calendar, not a template.',w.intent,`<button class="btn" data-nav="profile">Settings</button>`)}
    <div class="week-header"><div class="week-nav"><button class="icon-btn" data-action="prev">←</button><div><div class="eyebrow">Week ${w.index+1} · ${w.phaseLabel}</div><h2>${formatDate(w.start,{month:'short',day:'numeric'})}–${formatDate(w.end,{month:'short',day:'numeric'})}</h2></div><button class="icon-btn" data-action="next">→</button></div><div class="week-summary"><span class="summary-tag"><b>${w.mileage}</b> mi</span><span class="summary-tag"><b>${w.races.length}</b> races</span></div></div>
    <div class="phase-strip">${Object.entries(PHASES).map(([k,v])=>`<div class="phase-chip ${w.phase===k?'active':''}"><div class="phase-name">${v.label}</div><b>${w.phase===k?'Current':'Block'}</b></div>`).join('')}</div>
    <div class="calendar">${w.sessions.map(sessionCard).join('')}</div>
    <div style="height:16px"></div>
    <div class="grid grid-2"><div class="card"><div class="card-title">Week logic</div><p style="color:var(--muted)">${esc(w.doubleThreshold?.reason||w.intent)}</p><div class="notice ${w.doubleThreshold?.requested&&!w.doubleThreshold?.active?'warning':''}"><strong>${w.doubleThreshold?.active?'Double threshold active':'Guardrails active'}:</strong> missed hard work is not stacked later, and race proximity can replace quality with a primer.</div></div><div class="card"><div class="card-title">Training zones</div><div class="zone-grid">${['easy','steady','threshold','cv','vo2','repetition'].map(k=>`<div class="zone"><b>${zones[k].label}</b><span>${formatPace(zones[k].min)}–${formatPace(zones[k].max)}</span></div>`).join('')}</div></div></div>
  </div>`;
}
function sessionKey(s) { return s.slot ? `${s.date}:${s.slot.toLowerCase()}` : s.date; }
function sessionCard(s) {
  const key = sessionKey(s), done = !!state.completed[key];
  return `<article class="day-card ${s.category==='race'?'race':''}"><div class="day-top"><span>${formatDate(s.date,{weekday:'short'})}${s.slot?` · ${s.slot}`:''}</span><span class="day-num">${formatDate(s.date,{day:'numeric'})}</span></div><div class="session-kind">${s.category}${done?' · done':''}</div><div class="session-name">${esc(s.name)}</div><div class="session-detail">${esc(s.prescribed?.detail||s.description)}</div><div class="session-mile">${s.miles} mi</div><div style="position:absolute;right:10px;top:92px;display:flex;gap:5px"><button class="btn sm" data-action="complete" data-key="${key}">${done?'Undo':'Done'}</button>${!done&&s.category!=='race'?`<button class="btn sm ghost" data-action="miss" data-id="${s.id}">Missed</button>`:''}</div></article>`;
}

function analyzeView() {
  const week = findWeek(plan,todayISO()), target = week?.sessions.find(s=>s.date===todayISO()) || week?.sessions[0];
  return `<div class="content">${hero('Workout ingestion','Upload the run. Grade the execution.','GPX and FIT are parsed locally in-browser and compared with the planned session.')}
    <div class="grid grid-2"><div class="card"><div id="dropzone" class="upload-zone"><div><div class="upload-icon">↥</div><h3>Drop GPX or FIT</h3><p>Distance, pace, HR, cadence and interval structure are used when available.</p><label class="btn primary" for="activity-file">Choose file</label><input id="activity-file" class="file-input" type="file" accept=".gpx,.fit"></div></div></div><div class="card"><div class="metric-label">Expected</div><div class="metric smaller">${esc(target?.name||'No session')}</div><div class="metric-foot">${esc(target?.prescribed?.detail||target?.description||'')}</div></div></div>
    <div style="height:16px"></div>${activity ? analysisCard(activity,activityMatch) : `<div class="card"><div class="notice"><strong>Execution score, not physiology score.</strong> It measures how closely the uploaded run matched the prescription.</div></div>`}
  </div>`;
}
function analysisCard(a,m) { return `<div class="card"><div class="card-header"><div><div class="card-title">Activity analysis</div><div class="card-sub">${a.format} · ${a.records} samples</div></div></div><div class="analysis-score"><div class="score-bubble">${m?.score??'—'}</div><div class="score-details"><div class="metric-label">Execution score</div><div class="metric-foot">${(m?.flags||[]).join(' · ')||'No major mismatch flags.'}</div></div></div><div class="analysis-metrics"><div class="mini-metric"><span>Distance</span><b>${(a.distanceM/MILE_M).toFixed(2)} mi</b></div><div class="mini-metric"><span>Moving</span><b>${formatTime(a.movingDurationS)}</b></div><div class="mini-metric"><span>Pace</span><b>${formatPace(a.avgPacePerMile)}</b></div><div class="mini-metric"><span>Detected reps</span><b>${a.intervals.length}</b></div></div></div>`; }

function libraryView() {
  const list = WORKOUTS.filter(w => !query || `${w.name} ${w.category} ${(w.tags||[]).join(' ')}`.toLowerCase().includes(query));
  return `<div class="content">${hero('Workout system','One library. Thousands of scalable variants.','Canonical workout patterns are parameterized by event, phase, volume and pace — named pro/college sessions require sources.')}
    <div class="card"><div class="library-toolbar"><input class="search" data-search placeholder="Search threshold, hills, 800…" value="${esc(query)}"><span class="pill">${WORKOUTS.length} canonical patterns</span></div><div class="workout-list">${list.map(w=>`<div class="workout-item"><div class="workout-top"><div><div class="metric-label">${w.category}</div><h3>${esc(w.name)}</h3></div><span class="evidence">${w.evidence}</span></div><p>${esc(w.prescription)}</p><div class="tag-row">${(w.tags||[]).slice(0,5).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div>`).join('')}</div></div>
  </div>`;
}
function auditView() {
  return `<div class="content">${hero('External plan audit','Too little, enough, or too much?','Enter the structure of a coach or school week and Mileform checks load progression, hard-day count, long-run share and race proximity.')}
    <div class="grid grid-2"><div class="card"><form id="audit-form"><div class="form-grid"><div class="field"><label>Planned mileage</label><input name="mileage" type="number" step=".5" value="${state.profile.currentMileage}"></div><div class="field"><label>Hard days / races</label><input name="hardDays" type="number" min="0" max="7" value="2"></div><div class="field"><label>Long run miles</label><input name="longRun" type="number" step=".5" value="8"></div><div class="field"><label>Rest / very-low days</label><input name="restDays" type="number" min="0" max="7" value="1"></div><div class="field" style="grid-column:1/-1"><label>Next important race</label><input name="raceDate" type="date"></div></div><button class="btn primary" style="margin-top:16px" type="submit">Audit week</button></form><div class="notice" style="margin-top:16px"><strong>Not an injury predictor:</strong> this flags programming concerns; it does not calculate medical injury probability.</div></div><div class="card">${auditResult ? auditOutput(auditResult) : '<div class="empty">Run the audit to see deterministic findings.</div>'}</div></div>
  </div>`;
}
function auditOutput(r) { return `<div class="metric-label">Plan fit score</div><div class="audit-score">${r.score}<span style="font-size:18px;color:var(--muted)">/100</span></div>${r.findings.map(f=>`<div class="finding"><span class="finding-dot ${f.level}"></span><div><b>${esc(f.title)}</b><p>${esc(f.text)}</p></div></div>`).join('')}<div class="notice" style="margin-top:14px"><strong>${esc(r.supplement.title)}:</strong> ${esc(r.supplement.text)}</div>`; }

function scienceView() { return `<div class="content">${hero('Evidence registry','The rules need receipts.','Research-backed rules and normal coaching practice are labeled separately.')}<div class="card"><div class="science-list">${SCIENCE.map(s=>`<div class="science-item"><h3><a href="${s.url}" target="_blank" rel="noreferrer">${esc(s.title)} ↗</a></h3><p>${esc(s.takeaway)}</p><div class="science-meta">${s.year} · ${s.evidence}</div></div>`).join('')}</div></div></div>`; }

function profileView() {
  const p = state.profile;
  const prs = [...p.prs]; while (prs.length < 4) prs.push({eventId:'1600',seconds:300,date:''});
  return `<div class="content">${hero('Athlete setup','Inputs the engine can defend.','Change PRs, workload, goal and training style, then rebuild the season.')}
    <form id="profile-form"><div class="grid grid-2"><div class="card"><div class="card-title">Athlete</div><div class="form-grid" style="margin-top:14px"><div class="field"><label>Name</label><input name="name" value="${esc(p.name)}"></div><div class="field"><label>Age</label><input name="age" type="number" min="13" value="${p.age}"></div><div class="field"><label>Recent mileage</label><input name="currentMileage" type="number" step=".5" value="${p.currentMileage}"></div><div class="field"><label>Mileage ceiling</label><input name="maxMileage" type="number" step=".5" value="${p.maxMileage}"></div><div class="field"><label>Experience years</label><input name="experienceYears" type="number" step=".5" value="${p.experienceYears}"></div><div class="field"><label>Training style</label><select name="trainingStyle"><option value="standard">Standard</option><option value="double-threshold" ${p.trainingStyle==='double-threshold'?'selected':''} ${p.age<18?'disabled':''}>Double threshold · advanced 18+</option></select></div></div><div class="notice ${p.age<18?'warning':''}" style="margin-top:14px"><strong>Double threshold:</strong> adult-only in this build; it requires training history, higher stable volume, a race-free build/specific week, and does not add mileage.</div></div><div class="card"><div class="card-title">Goal</div><div class="form-grid" style="margin-top:14px"><div class="field"><label>Event</label><select name="goalEvent">${EVENTS.map(e=>`<option value="${e.id}" ${e.id===p.goal.eventId?'selected':''}>${e.label}</option>`).join('')}</select></div><div class="field"><label>Goal time</label><input name="goalTime" value="${formatTime(p.goal.seconds,true)}"></div><div class="field"><label>Date</label><input name="goalDate" type="date" value="${p.goal.date}"></div><div class="field"><label>Label</label><input name="goalLabel" value="${esc(p.goal.label||'Goal race')}"></div></div></div></div>
    <div style="height:16px"></div><div class="card"><div class="card-title">PRs</div><div style="overflow:auto"><table class="pr-table"><thead><tr><th>Event</th><th>Time</th><th>Date</th></tr></thead><tbody>${prs.map((pr,i)=>`<tr><td><select name="prEvent${i}">${EVENTS.map(e=>`<option value="${e.id}" ${e.id===pr.eventId?'selected':''}>${e.label}</option>`).join('')}</select></td><td><input name="prTime${i}" value="${formatTime(pr.seconds,true)}"></td><td><input name="prDate${i}" type="date" value="${pr.date||''}"></td></tr>`).join('')}</tbody></table></div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><button type="button" class="btn ghost" data-action="reset">Reset demo</button><button class="btn primary" type="submit">Save + rebuild</button></div></div></form>
  </div>`;
}

function bind() {
  const input = document.getElementById('activity-file'), zone = document.getElementById('dropzone');
  if (input) input.addEventListener('change', () => input.files?.[0] && handleFile(input.files[0]));
  if (zone) {
    ['dragover','dragenter'].forEach(ev => zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('drag')}));
    zone.addEventListener('dragleave',()=>zone.classList.remove('drag'));
    zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag');if(e.dataTransfer.files?.[0])handleFile(e.dataTransfer.files[0])});
  }
  document.getElementById('profile-form')?.addEventListener('submit', saveProfile);
  document.getElementById('audit-form')?.addEventListener('submit', runAudit);
}
function runAudit(e) {
  e.preventDefault(); const input = Object.fromEntries(new FormData(e.currentTarget).entries());
  const result = auditWeek(input, state.profile); result.supplement = suggestedSupplement(result, input, state.profile); auditResult = result; renderView();
}
async function handleFile(file) {
  try {
    activity = await parseActivityFile(file);
    const w = findWeek(plan,todayISO()), target = w?.sessions.find(s=>s.date===todayISO()) || w?.sessions[0];
    activityMatch = target ? matchActivityToSession(activity,target,state.profile) : null;
    renderView();
  } catch (err) { alert(err.message || 'Could not parse file.'); }
}
function parseTime(s) { const p=String(s||'').split(':').map(Number); if(p.some(Number.isNaN)) return NaN; return p.length===1?p[0]:p.length===2?p[0]*60+p[1]:p[0]*3600+p[1]*60+p[2]; }
function saveProfile(e) {
  e.preventDefault(); const f = new FormData(e.currentTarget); const age = Number(f.get('age')) || 16; const goalEvent = eventById(f.get('goalEvent'));
  const prs=[]; for(let i=0;i<4;i++){ const ev=eventById(f.get(`prEvent${i}`)), sec=parseTime(f.get(`prTime${i}`)); if(sec>0) prs.push({eventId:ev.id,distance:ev.distance,seconds:sec,date:String(f.get(`prDate${i}`)||'')}); }
  state.profile = {...state.profile,name:String(f.get('name')||'Athlete'),age,currentMileage:Number(f.get('currentMileage'))||0,maxMileage:Number(f.get('maxMileage'))||0,experienceYears:Number(f.get('experienceYears'))||0,trainingStyle:age<18?'standard':String(f.get('trainingStyle')||'standard'),prs,goal:{eventId:goalEvent.id,seconds:parseTime(f.get('goalTime')),date:String(f.get('goalDate')),label:String(f.get('goalLabel')||'Goal race')}};
  rebuild(); go('dashboard');
}

render();
