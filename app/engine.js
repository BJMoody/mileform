import { EVENTS, PHASES, WORKOUTS } from './data.js';

const DAY_MS = 86400000;
const MILE_M = 1609.344;

export function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
export function round(v, d = 0) { const p = 10 ** d; return Math.round(v * p) / p; }
export function eventById(id) { return EVENTS.find(e => e.id === id) || EVENTS[0]; }
export function workoutById(id) { return WORKOUTS.find(w => w.id === id); }

export function parseTime(value) {
  if (typeof value === 'number') return value;
  const s = String(value || '').trim();
  if (!s) return NaN;
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  const parts = s.split(':').map(Number);
  if (parts.some(Number.isNaN)) return NaN;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return NaN;
}

export function formatTime(seconds, tenths = false) {
  if (!Number.isFinite(seconds)) return '—';
  const s = Math.max(0, seconds);
  if (s >= 3600) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.round(s % 60);
    return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }
  const m = Math.floor(s / 60);
  const rem = s - m * 60;
  const sec = tenths ? rem.toFixed(1).padStart(4,'0') : String(Math.round(rem)).padStart(2,'0');
  return `${m}:${sec}`;
}

export function formatPace(secondsPerMile) {
  if (!Number.isFinite(secondsPerMile)) return '—';
  const m = Math.floor(secondsPerMile / 60);
  const s = Math.round(secondsPerMile % 60);
  return `${m}:${String(s).padStart(2,'0')}/mi`;
}

export function formatDate(dateStr, opts = { month: 'short', day: 'numeric' }) {
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('en-US', opts).format(d);
}

export function daysBetween(a, b) {
  const da = new Date(`${a}T12:00:00`), db = new Date(`${b}T12:00:00`);
  return Math.round((db - da) / DAY_MS);
}

export function todayISO() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
}

export function mondayOf(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0,10);
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0,10);
}

// Fits an athlete-specific log(time) = intercept + exponent*log(distance) curve.
// With one PR, falls back to the standard Riegel-style exponent of 1.06.
export function fitPowerCurve(prs) {
  const points = prs.filter(p => p.distance > 0 && p.seconds > 0);
  if (!points.length) return { exponent: 1.06, intercept: Math.log(300 / Math.pow(1609.344, 1.06)), r2: 0, n: 0 };
  if (points.length === 1) {
    const p = points[0], exponent = 1.06;
    return { exponent, intercept: Math.log(p.seconds) - exponent * Math.log(p.distance), r2: 0, n: 1 };
  }
  const xs = points.map(p => Math.log(p.distance));
  const ys = points.map(p => Math.log(p.seconds));
  const mx = xs.reduce((a,b)=>a+b,0)/xs.length;
  const my = ys.reduce((a,b)=>a+b,0)/ys.length;
  const cov = xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
  const vx = xs.reduce((s,x)=>s+(x-mx)**2,0) || 1;
  const exponent = clamp(cov / vx, 1.01, 1.16);
  const intercept = my - exponent * mx;
  const predicted = xs.map(x => intercept + exponent*x);
  const ssRes = ys.reduce((s,y,i)=>s+(y-predicted[i])**2,0);
  const ssTot = ys.reduce((s,y)=>s+(y-my)**2,0) || 1;
  return { exponent, intercept, r2: clamp(1 - ssRes/ssTot, 0, 1), n: points.length };
}

export function predictTime(curve, distance) {
  return Math.exp(curve.intercept + curve.exponent * Math.log(distance));
}

export function currentEquivalent(profile, targetDistance) {
  const prs = profile.prs || [];
  const exact = prs.filter(p => Math.abs(p.distance - targetDistance) <= Math.max(5, targetDistance * 0.002) && p.seconds > 0);
  if (exact.length) return Math.min(...exact.map(p => p.seconds));
  const curve = fitPowerCurve(prs);
  return predictTime(curve, targetDistance);
}

// D = CS*t + D′. Uses performances 2–20 minutes where possible.
export function estimateCriticalSpeed(prs) {
  let points = prs.filter(p => p.seconds >= 90 && p.seconds <= 1800 && p.distance > 0);
  if (points.length < 2) points = prs.filter(p => p.seconds > 0 && p.distance > 0);
  if (points.length < 2) return null;
  const xs = points.map(p => p.seconds);
  const ys = points.map(p => p.distance);
  const mx = xs.reduce((a,b)=>a+b,0)/xs.length;
  const my = ys.reduce((a,b)=>a+b,0)/ys.length;
  const cov = xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
  const vx = xs.reduce((s,x)=>s+(x-mx)**2,0) || 1;
  const cs = cov/vx;
  const dPrime = my - cs*mx;
  if (cs <= 1.5 || cs >= 9 || dPrime < -500 || dPrime > 1200) return null;
  return { cs, dPrime, pacePerMile: MILE_M/cs, n: points.length };
}

export function trainingZones(profile) {
  const curve = fitPowerCurve(profile.prs || []);
  const csModel = estimateCriticalSpeed(profile.prs || []);
  const fiveKSec = currentEquivalent(profile, 5000);
  const fiveKPace = fiveKSec/5000*MILE_M;
  const csPace = csModel?.pacePerMile || fiveKPace * 1.08;
  const mileSec = currentEquivalent(profile, MILE_M);
  const milePace = mileSec;
  const eightSec = currentEquivalent(profile, 800);
  const event = eventById(profile.goal?.eventId || '5000');
  const goalPace = profile.goal?.seconds ? profile.goal.seconds/event.distance*MILE_M : fiveKPace;
  return {
    recovery: { label: 'Recovery', min: Math.max(csPace*1.30, fiveKPace*1.38), max: Math.max(csPace*1.48, fiveKPace*1.60) },
    easy: { label: 'Easy', min: csPace*1.18, max: csPace*1.38 },
    steady: { label: 'Steady', min: csPace*1.08, max: csPace*1.17 },
    threshold: { label: 'Threshold', min: csPace*0.99, max: csPace*1.05 },
    cv: { label: 'CV', min: fiveKPace*0.98, max: fiveKPace*1.04 },
    vo2: { label: 'VO₂', min: fiveKPace*0.90, max: fiveKPace*0.97 },
    '5k': { label: '5K', min: fiveKPace*0.985, max: fiveKPace*1.015 },
    '3k': { label: '3K', min: predictTime(curve, 3000)/3000*MILE_M*0.985, max: predictTime(curve,3000)/3000*MILE_M*1.015 },
    mile: { label: 'Mile', min: milePace*0.985, max: milePace*1.015 },
    '800': { label: '800', min: eightSec/800*MILE_M*0.985, max: eightSec/800*MILE_M*1.015 },
    goal: { label: 'Goal', min: goalPace*0.99, max: goalPace*1.01 },
    repetition: { label: 'Speed', min: milePace*0.82, max: milePace*0.96 }
  };
}

export function goalAssessment(profile, fromDate = todayISO()) {
  const event = eventById(profile.goal.eventId);
  const current = currentEquivalent(profile, event.distance);
  const goal = profile.goal.seconds;
  const gapPct = ((current - goal) / current) * 100;
  const days = Math.max(1, daysBetween(fromDate, profile.goal.date));
  const weeks = days / 7;
  // Classification only: no promise/forecast of exact adaptation.
  const weeklyGap = gapPct / Math.max(weeks, 1);
  let label = 'On-range';
  if (goal >= current) label = 'Current fitness already meets it';
  else if (weeklyGap > 0.65 || gapPct > 12) label = 'Very aggressive';
  else if (weeklyGap > 0.35 || gapPct > 8) label = 'Aggressive';
  else if (weeklyGap > 0.15 || gapPct > 4) label = 'Stretch';
  return { current, goal, gapPct, days, weeks, label };
}

// Double-threshold is intentionally treated as an advanced adult-only organization
// of training, not a way to add unlimited quality. The prototype only activates it
// in build/specific phases, on race-free weeks, and keeps weekly mileage unchanged.
export function doubleThresholdStatus(profile, phase = 'build', races = [], mileage = Number(profile.currentMileage)||0) {
  if (profile.trainingStyle !== 'double-threshold') return { requested:false, active:false, reason:'Standard training style selected.' };
  if (Number(profile.age) < 18) return { requested:true, active:false, reason:'Double-threshold mode is disabled for athletes under 18.' };
  if (Number(profile.experienceYears) < 4) return { requested:true, active:false, reason:'Requires at least four years of consistent run training.' };
  if (Number(profile.currentMileage) < 45 || Number(profile.maxMileage) < 50) return { requested:true, active:false, reason:'Requires a stable high-volume base before split threshold days are considered.' };
  if (!['build','specific'].includes(phase)) return { requested:true, active:false, reason:'Only used during build and race-specific phases.' };
  if (races.length) return { requested:true, active:false, reason:'Disabled during race weeks.' };
  if (mileage < 45) return { requested:true, active:false, reason:'This week is below the minimum volume threshold for the mode.' };
  return { requested:true, active:true, reason:'One split threshold day this week; weekly mileage is not increased.' };
}

export function phaseForDate(profile, dateStr) {
  const goalDate = profile.goal.date;
  const days = daysBetween(dateStr, goalDate);
  if (days <= 10) return 'taper';
  if (days <= 24) return 'peak';
  if (days <= 56) return 'specific';
  if (days <= 112) return 'build';
  return 'base';
}

function phaseQualityIds(eventId, phase, weekIndex) {
  const is800 = eventId === '800';
  const isMile = eventId === '1600' || eventId === 'mile';
  if (phase === 'base') return [weekIndex%2 ? 'fartlek-1on1off':'hill-long', weekIndex%2 ? 'threshold-2x10':'cruise-1k'];
  if (phase === 'build') {
    if (is800 || isMile) return [weekIndex%2 ? 'vo2-600':'cv-800', weekIndex%2 ? 'threshold-3x8':'cruise-1k'];
    return [weekIndex%2 ? 'vo2-1k':'cv-1k', weekIndex%2 ? 'threshold-3x8':'cruise-mile'];
  }
  if (phase === 'specific') {
    if (is800) return [weekIndex%2 ? '800-300':'vo2-600', weekIndex%2 ? 'threshold-20':'800-200'];
    if (isMile) return [weekIndex%2 ? 'mile-400':'mile-600', weekIndex%2 ? 'threshold-20':'3k-400'];
    if (eventId === '3200') return [weekIndex%2 ? '3k-400':'vo2-800', weekIndex%2 ? 'cruise-1k':'cv-1k'];
    return [weekIndex%2 ? '5k-400':'vo2-1k', weekIndex%2 ? 'threshold-20':'cv-1k'];
  }
  if (phase === 'peak') {
    if (is800) return ['800-300','speed-150'];
    if (isMile) return ['mile-400','speed-150'];
    return [eventId === '3200' ? '3k-400':'5k-400','threshold-2x10'];
  }
  return [is800 || isMile ? 'primer-middle':'primer-distance', 'easy-strides'];
}

function weekMileage(profile, weekIndex, phase, totalWeeks) {
  const start = Math.max(8, Number(profile.currentMileage) || 25);
  const cap = Math.max(start, Number(profile.maxMileage) || start*1.25);
  const youth = Number(profile.age) < 18;
  const maxRamp = youth ? 0.06 : 0.08;
  let base = start;
  for (let i=0;i<weekIndex;i++) {
    const deload = (i+1)%4 === 0;
    base = deload ? base*0.90 : Math.min(cap, base*(1+maxRamp));
  }
  const factor = PHASES[phase].mileageFactor;
  // Don't let phase labels instantly force huge jumps/drops early in a plan.
  const scaled = Math.min(cap, base * (phase === 'base' ? Math.max(0.95,factor) : factor));
  return round(Math.max(7, scaled), 1);
}

function distributeMiles(total, hardCount, hasRace) {
  const weights = [0.16, 0.13, 0.12, 0.14, 0.10, hasRace ? 0.12 : 0.13, 0.22];
  const sum = weights.reduce((a,b)=>a+b,0);
  return weights.map(w => round(total*w/sum, 1));
}

function raceOnDate(profile, date) {
  return (profile.races || []).find(r => r.date === date);
}

function racesInWeek(profile, weekStart) {
  const end = addDays(weekStart, 6);
  return (profile.races || []).filter(r => r.date >= weekStart && r.date <= end);
}

function session(id, miles, zones, extras={}) {
  const w = workoutById(id);
  return {
    id: cryptoRandomId(),
    workoutId: id,
    name: w?.name || id,
    category: w?.category || 'easy',
    miles: round(miles,1),
    description: w?.prescription || '',
    zones: zones || w?.zones || [],
    load: w?.load || 1,
    completed: false,
    ...extras
  };
}

function cryptoRandomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

export function prescribeWorkout(workout, profile, weekMileageValue) {
  const zones = trainingZones(profile);
  const z = zones[workout.zones?.[0]];
  const result = { ...workout };
  if (workout.repDistance && workout.reps) {
    const low = workout.reps[0], high = workout.reps[1];
    const experience = clamp(Number(profile.experienceYears)||0,0,6);
    const mileageRatio = clamp(weekMileageValue / Math.max(20, profile.maxMileage||40), 0, 1);
    const reps = Math.round(low + (high-low)*clamp((experience/5 + mileageRatio)/2,0,1));
    const targetPace = z ? (z.min+z.max)/2 : null;
    const targetRep = targetPace ? targetPace * (workout.repDistance/MILE_M) : null;
    result.detail = `${reps} × ${prettyDistance(workout.repDistance)}${targetRep ? ` @ ~${formatTime(targetRep, workout.repDistance <= 400)}`:''}`;
    result.targetRepSeconds = targetRep;
    result.repsSelected = reps;
    result.restSelected = Math.round((workout.restSeconds?.[0] + workout.restSeconds?.[1])/2) || null;
  } else if (z) {
    result.detail = `${z.label}: ${formatPace(z.min)}–${formatPace(z.max)}`;
  }
  return result;
}

function prettyDistance(m) {
  if (Math.abs(m-MILE_M)<5) return '1 mile';
  if (m >= 1000 && m%1000===0) return `${m/1000}K`;
  return `${Math.round(m)}m`;
}

export function generatePlan(profile, fromDate = todayISO()) {
  const firstWeek = mondayOf(fromDate);
  const goalWeek = mondayOf(profile.goal.date);
  const totalWeeks = Math.max(1, Math.floor(daysBetween(firstWeek, goalWeek)/7)+1);
  const eventId = profile.goal.eventId;
  const weeks = [];
  for (let wi=0; wi<totalWeeks; wi++) {
    const weekStart = addDays(firstWeek, wi*7);
    const phase = phaseForDate(profile, weekStart);
    const mileage = weekMileage(profile, wi, phase, totalWeeks);
    const races = racesInWeek(profile, weekStart);
    const miles = distributeMiles(mileage, 2, races.length>0);
    const quality = phaseQualityIds(eventId, phase, wi);
    const doubleThreshold = doubleThresholdStatus(profile, phase, races, mileage);
    let sessions = [];
    for (let d=0; d<7; d++) {
      const date = addDays(weekStart,d);
      const race = raceOnDate(profile,date);
      if (race) {
        sessions.push(session('easy-strides', Math.max(2,miles[d]), [], { date, name: race.name, category: 'race', description: `${race.importance || 'B'} race · ${prettyDistance(race.distance)}`, race }));
        continue;
      }
      if (d === 1 && doubleThreshold.active) {
        const amMiles = round(miles[d]*0.52,1);
        const pmMiles = round(Math.max(0,miles[d]-amMiles),1);
        sessions.push(session('double-threshold-am', amMiles, ['threshold'], { date, slot:'AM', doubleThreshold:true, note:'Advanced split-quality day. Keep the morning controlled and leave substantial recovery before the PM session.' }));
        sessions.push(session('double-threshold-pm', pmMiles, ['threshold'], { date, slot:'PM', doubleThreshold:true, note:'Second controlled threshold session; do not turn this into a race-effort workout.' }));
      }
      else if (d === 1) sessions.push(session(quality[0], miles[d], undefined, { date }));
      else if (d === 3 && doubleThreshold.active) sessions.push(session(quality[0], miles[d], undefined, { date, note:'Primary event-specific quality session for the week.' }));
      else if (d === 3) sessions.push(session(quality[1], miles[d], undefined, { date }));
      else if (d === 6) sessions.push(session('long-easy', Math.max(miles[d], mileage*0.19), ['easy'], { date }));
      else if (d === 5) sessions.push(session('easy-strides', miles[d], undefined, { date }));
      else if (d === 4 && Number(profile.age)<18) sessions.push(session('recovery', Math.max(0, miles[d]*0.55), ['recovery'], { date, optional: true }));
      else sessions.push(session('easy-strides', miles[d], ['easy'], { date }));
    }
    // Safety: if an A-race exists, remove hard work in preceding 48h and add primer.
    const aRace = races.find(r => r.importance === 'A');
    if (aRace) {
      const raceIndex = sessions.findIndex(s => s.date === aRace.date);
      for (let i=Math.max(0,raceIndex-2); i<raceIndex; i++) {
        if (sessions[i].load >= 4 || ['threshold','vo2','racepace'].includes(sessions[i].category)) {
          sessions[i] = session(i===raceIndex-2 ? (eventId==='800'||eventId==='1600'||eventId==='mile'?'primer-middle':'primer-distance') : 'recovery', Math.max(2,miles[i]*0.65), undefined, { date:sessions[i].date });
        }
      }
    }
    sessions = sessions.map(s => ({ ...s, prescribed: prescribeWorkout(workoutById(s.workoutId) || {zones:s.zones}, profile, mileage) }));
    weeks.push({
      index: wi,
      start: weekStart,
      end: addDays(weekStart,6),
      phase,
      phaseLabel: PHASES[phase].label,
      mileage,
      races,
      sessions,
      doubleThreshold,
      intent: PHASES[phase].purpose
    });
  }
  return { weeks, assessment: goalAssessment(profile, fromDate), zones: trainingZones(profile), cs: estimateCriticalSpeed(profile.prs || []) };
}

export function findWeek(plan, dateStr=todayISO()) {
  return plan.weeks.find(w => dateStr >= w.start && dateStr <= w.end) || plan.weeks[0];
}

export function rescheduleMissed(plan, weekIndex, sessionRef, profile) {
  const clone = structuredClone(plan);
  const week = clone.weeks[weekIndex];
  if (!week) return clone;
  const idx = week.sessions.findIndex(s => s.id === sessionRef || s.date === sessionRef);
  if (idx < 0) return clone;
  const missed = week.sessions[idx];
  const sessionDate = missed.date;
  missed.missed = true;
  missed.note = 'Missed — intentionally not made up.';
  if (missed.doubleThreshold) {
    missed.note = 'Missed half of a split threshold day — dropped, not moved or made up.';
    return clone;
  }
  if (['easy','recovery','long'].includes(missed.category)) return clone;
  const nextRaceIdx = week.sessions.findIndex((s,i)=>i>idx && s.category==='race');
  if (nextRaceIdx !== -1 && nextRaceIdx-idx <= 3) {
    missed.note = 'Missed quality dropped because a race is close. Do not cram it into race week.';
    return clone;
  }
  const candidate = week.sessions.findIndex((s,i)=> i>idx && i<=idx+3 && s.category!=='race' && s.load<=2);
  if (candidate > 0) {
    const priorHard = week.sessions.slice(Math.max(0,candidate-2),candidate).some(s=>s.load>=4 && !s.missed);
    const nextHard = week.sessions.slice(candidate+1,candidate+3).some(s=>s.load>=4 && !s.missed);
    if (!priorHard && !nextHard) {
      const moved = { ...missed, id: cryptoRandomId(), date: week.sessions[candidate].date, missed:false, movedFrom:sessionDate, note:'Moved once; no extra volume added.' };
      week.sessions[candidate] = moved;
      missed.note = `Moved to ${formatDate(moved.date)} because there is adequate recovery spacing.`;
    }
  }
  return clone;
}

export function auditWeek(input, profile) {
  const planned = Number(input.mileage) || 0;
  const baseline = Number(profile.currentMileage) || planned || 1;
  const hardDays = Number(input.hardDays) || 0;
  const longRun = Number(input.longRun) || 0;
  const restDays = Number(input.restDays) || 0;
  const daysToRace = input.raceDate ? daysBetween(todayISO(), input.raceDate) : 999;
  const findings = [];
  const ramp = (planned-baseline)/baseline;
  if (ramp > (Number(profile.age)<18?0.07:0.10)) findings.push({level:'warn',title:'Mileage jump is aggressive',text:`This week is ${Math.round(ramp*100)}% above your recent baseline. The engine would usually spread that increase across more weeks.`});
  else if (ramp < -0.22 && daysToRace > 14) findings.push({level:'info',title:'Volume is well below baseline',text:'If this is not a planned recovery/taper week, the schedule may be too light for the current phase.'});
  else findings.push({level:'good',title:'Mileage is in range',text:'Weekly volume is close enough to your recent baseline to progress without forcing a large jump.'});
  if (hardDays > 2) findings.push({level:'warn',title:'Too many hard days',text:'For this version, the engine caps most high-school distance weeks at two demanding run sessions, with races counting as hard.'});
  else findings.push({level:'good',title:'Hard-day count is reasonable',text:`${hardDays} demanding day${hardDays===1?'':'s'} leaves room for adaptation between sessions.`});
  if (planned > 0 && longRun/planned > 0.28) findings.push({level:'warn',title:'Long run is a large share of the week',text:'One run is carrying too much of the weekly load. The engine would shorten it or redistribute easy volume.'});
  if (restDays < 1 && Number(profile.age)<18) findings.push({level:'warn',title:'No true recovery day',text:'Youth guardrails keep at least one rest or very-low-load day in the week.'});
  if (daysToRace <= 7 && ramp > 0) findings.push({level:'warn',title:'Race week is getting heavier',text:'With an important race this close, added volume is unlikely to be the best tradeoff. Keep rhythm, cut fatigue.'});
  const warningCount = findings.filter(f=>f.level==='warn').length;
  return { score: clamp(100-warningCount*18,45,100), findings, ramp };
}

export function suggestedSupplement(audit, input, profile) {
  if (audit.findings.some(f=>f.title==='Too many hard days' || f.title==='Mileage jump is aggressive')) {
    return { title:'No add-on recommended', text:'The bigger win is recovery and better spacing, not another workout.' };
  }
  const deficit = Math.max(0,(profile.currentMileage||0)-(Number(input.mileage)||0));
  if (deficit >= 4) return { title:'Small aerobic add-on', text:'Add 20–30 minutes easy on one existing easy day, or split the volume across two easy days. Do not add a third hard session.' };
  return { title:'Plan is sufficiently loaded', text:'No supplemental workout is needed. Keep the quality days high-quality and the easy days easy.' };
}

export function matchActivityToSession(activity, session, profile) {
  if (!activity || !session) return null;
  const prescribedMiles = session.miles || 0;
  const actualMiles = activity.distanceM / MILE_M;
  const completion = prescribedMiles > 0 ? clamp(1 - Math.abs(actualMiles-prescribedMiles)/Math.max(prescribedMiles,1),0,1) : 1;
  const zones = trainingZones(profile);
  const zoneKey = session.zones?.[0] || (session.category==='easy'?'easy':null);
  const z = zones[zoneKey];
  const actualPace = activity.movingDurationS && activity.distanceM ? activity.movingDurationS/activity.distanceM*MILE_M : NaN;
  let paceScore = 0.75;
  if (z && Number.isFinite(actualPace)) {
    if (actualPace >= z.min && actualPace <= z.max) paceScore = 1;
    else {
      const nearest = actualPace < z.min ? z.min : z.max;
      paceScore = clamp(1-Math.abs(actualPace-nearest)/nearest*4,0,1);
    }
  }
  const intervalExpected = ['vo2','racepace','cv','threshold','primer','speed','hills','fartlek'].includes(session.category);
  const detected = activity.intervals?.length || 0;
  let structure = intervalExpected ? clamp(detected/Math.max(1,session.prescribed?.repsSelected||4),0.4,1) : 1;
  const steadiness = Number.isFinite(activity.paceCV) ? clamp(1-activity.paceCV*2.5,0.35,1) : 0.8;
  const score = Math.round(100*(0.35*completion+0.35*paceScore+0.20*structure+0.10*steadiness));
  const flags = [];
  if (completion < .8) flags.push('Short of prescribed volume');
  if (paceScore < .7) flags.push('Pace sat outside the intended zone');
  if (intervalExpected && detected === 0) flags.push('Interval structure could not be detected from the file');
  if (activity.pauseRatio > 0.12) flags.push('Large stopped-time share');
  return { score, completion, paceScore, structure, steadiness, flags, actualMiles, actualPace };
}
