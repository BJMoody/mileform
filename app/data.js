export const BRAND = {
  name: 'Mileform',
  tagline: 'Build the race before you run it.',
  accent: '#ff5b36'
};

export const EVENTS = [
  { id: '800', label: '800m', distance: 800, family: 'middle' },
  { id: '1600', label: '1600m', distance: 1600, family: 'middle' },
  { id: 'mile', label: 'Mile', distance: 1609.344, family: 'middle' },
  { id: '3200', label: '3200m', distance: 3200, family: 'distance' },
  { id: '5000', label: '5K', distance: 5000, family: 'distance' },
  { id: '8000', label: '8K', distance: 8000, family: 'distance' },
  { id: '10000', label: '10K', distance: 10000, family: 'distance' }
];

export const PHASES = {
  base: {
    label: 'Base',
    purpose: 'Build durable aerobic volume, mechanics, hills and relaxed speed.',
    qualityShare: 0.16,
    mileageFactor: 0.9
  },
  build: {
    label: 'Build',
    purpose: 'Raise threshold and aerobic power while preserving easy volume.',
    qualityShare: 0.2,
    mileageFactor: 1.0
  },
  specific: {
    label: 'Race specific',
    purpose: 'Shift quality toward the demands of the goal event without stacking hard days.',
    qualityShare: 0.23,
    mileageFactor: 0.95
  },
  peak: {
    label: 'Peak',
    purpose: 'Keep race-specific intensity, trim fatigue and sharpen mechanics.',
    qualityShare: 0.21,
    mileageFactor: 0.82
  },
  taper: {
    label: 'Taper',
    purpose: 'Reduce volume while retaining small doses of intensity and rhythm.',
    qualityShare: 0.18,
    mileageFactor: 0.68
  }
};

// Canonical sessions, not copied plans. The engine scales these patterns to athlete/event/phase.
// A production database should retain source metadata for any named college/pro session.
export const WORKOUTS = [
  {
    id: 'easy-strides', name: 'Easy + strides', category: 'easy', zones: ['easy','repetition'],
    tags: ['mechanics','neuromuscular','base','build','specific'],
    prescription: 'Easy running + 4–8 × 15–20 sec relaxed strides, full walk/jog reset.',
    load: 1, minExperience: 0, evidence: 'supportive'
  },
  {
    id: 'aerobic-steady', name: 'Aerobic steady run', category: 'steady', zones: ['steady'],
    tags: ['aerobic','base','build'],
    prescription: 'Continuous steady running below threshold; controlled enough to finish smooth.',
    load: 2, minExperience: 0, evidence: 'supportive'
  },
  {
    id: 'progression', name: 'Progression run', category: 'steady', zones: ['easy','steady','threshold'],
    tags: ['aerobic','base','build'],
    prescription: 'Start easy and gradually progress to steady/controlled threshold effort near the end.',
    load: 2, minExperience: 1, evidence: 'supportive'
  },
  {
    id: 'long-easy', name: 'Easy long run', category: 'long', zones: ['easy'],
    tags: ['aerobic','base','build','specific'],
    prescription: 'Continuous easy running. Keep the finish comfortable; duration matters more than pace.',
    load: 2, minExperience: 0, evidence: 'strong'
  },
  {
    id: 'long-fast-finish', name: 'Long run + steady finish', category: 'long', zones: ['easy','steady'],
    tags: ['aerobic','build','specific'],
    prescription: 'Easy long run with the final 10–20% at steady effort, not race effort.',
    load: 3, minExperience: 2, evidence: 'supportive'
  },
  {
    id: 'threshold-20', name: 'Continuous threshold', category: 'threshold', zones: ['threshold'],
    tags: ['threshold','build','specific'],
    prescription: '15–25 min continuous at controlled threshold effort.',
    load: 3, minExperience: 1, evidence: 'strong'
  },
  {
    id: 'cruise-1k', name: '1K cruise intervals', category: 'threshold', zones: ['threshold'],
    tags: ['threshold','build','specific'],
    prescription: '4–7 × 1K at threshold with 60–90 sec easy jog.',
    repDistance: 1000, reps: [4,7], restSeconds: [60,90], load: 3, minExperience: 1, evidence: 'strong'
  },
  {
    id: 'cruise-mile', name: 'Mile cruise intervals', category: 'threshold', zones: ['threshold'],
    tags: ['threshold','build','specific'],
    prescription: '3–5 × 1 mile at threshold with 60–120 sec easy jog.',
    repDistance: 1609.344, reps: [3,5], restSeconds: [60,120], load: 4, minExperience: 2, evidence: 'strong'
  },
  {
    id: 'threshold-2x10', name: 'Split threshold', category: 'threshold', zones: ['threshold'],
    tags: ['threshold','build'],
    prescription: '2 × 8–12 min at threshold with 2 min easy jog.',
    load: 3, minExperience: 1, evidence: 'strong'
  },
  {
    id: 'threshold-3x8', name: '3 × 8 min threshold', category: 'threshold', zones: ['threshold'],
    tags: ['threshold','build','specific'],
    prescription: '3 × 8 min around threshold with 90 sec–2 min jog.',
    load: 4, minExperience: 2, evidence: 'strong'
  },
  {
    id: 'double-threshold-am', name: 'Double threshold · AM', category: 'threshold', zones: ['threshold'],
    tags: ['threshold','advanced','double-threshold','build','specific'],
    prescription: 'Controlled morning threshold intervals. Keep the session submaximal and repeatable; this is one half of a split quality day.',
    repDistance: 1609.344, reps: [2,4], restSeconds: [60,120], load: 3, minExperience: 4, evidence: 'emerging'
  },
  {
    id: 'double-threshold-pm', name: 'Double threshold · PM', category: 'threshold', zones: ['threshold'],
    tags: ['threshold','advanced','double-threshold','build','specific'],
    prescription: 'Shorter evening threshold intervals after substantial recovery from the morning session. Total daily load stays capped by the plan.',
    repDistance: 400, reps: [6,10], restSeconds: [30,60], load: 3, minExperience: 4, evidence: 'emerging'
  },
  {
    id: 'cv-800', name: 'Critical-velocity 800s', category: 'cv', zones: ['cv'],
    tags: ['aerobic-power','build','specific'],
    prescription: '5–8 × 800m around 8K–5K effort with 60–90 sec jog.',
    repDistance: 800, reps: [5,8], restSeconds: [60,90], load: 4, minExperience: 1, evidence: 'supportive'
  },
  {
    id: 'cv-1k', name: 'Critical-velocity 1Ks', category: 'cv', zones: ['cv'],
    tags: ['aerobic-power','build','specific'],
    prescription: '4–6 × 1K around 8K–5K effort with 75–120 sec jog.',
    repDistance: 1000, reps: [4,6], restSeconds: [75,120], load: 4, minExperience: 2, evidence: 'supportive'
  },
  {
    id: 'vo2-1k', name: 'VO₂ 1Ks', category: 'vo2', zones: ['vo2'],
    tags: ['vo2','build','specific','3200','5000'],
    prescription: '4–6 × 1K around 3K–5K effort with 2–3 min recovery.',
    repDistance: 1000, reps: [4,6], restSeconds: [120,180], load: 5, minExperience: 2, evidence: 'strong'
  },
  {
    id: 'vo2-800', name: 'VO₂ 800s', category: 'vo2', zones: ['vo2'],
    tags: ['vo2','build','specific','1600','3200','5000'],
    prescription: '5–8 × 800m around 3K effort with 2 min recovery.',
    repDistance: 800, reps: [5,8], restSeconds: [90,150], load: 5, minExperience: 1, evidence: 'strong'
  },
  {
    id: 'vo2-600', name: 'VO₂ 600s', category: 'vo2', zones: ['vo2'],
    tags: ['vo2','specific','1600','3200'],
    prescription: '6–10 × 600m around 3K effort with 90 sec–2 min recovery.',
    repDistance: 600, reps: [6,10], restSeconds: [90,120], load: 5, minExperience: 1, evidence: 'strong'
  },
  {
    id: '5k-400', name: '5K rhythm 400s', category: 'racepace', zones: ['5k'],
    tags: ['specific','5000'],
    prescription: '10–16 × 400m at 5K pace with 100–200m jog.',
    repDistance: 400, reps: [10,16], restSeconds: [45,75], load: 4, minExperience: 1, evidence: 'supportive'
  },
  {
    id: '3k-400', name: '3K rhythm 400s', category: 'racepace', zones: ['3k'],
    tags: ['specific','1600','3200','5000'],
    prescription: '8–12 × 400m around 3K pace with 60–90 sec recovery.',
    repDistance: 400, reps: [8,12], restSeconds: [60,90], load: 5, minExperience: 1, evidence: 'supportive'
  },
  {
    id: 'mile-400', name: 'Mile-pace 400s', category: 'racepace', zones: ['mile'],
    tags: ['specific','1600','mile'],
    prescription: '6–10 × 400m at mile pace with 90 sec–2:30 recovery depending on phase.',
    repDistance: 400, reps: [6,10], restSeconds: [90,150], load: 5, minExperience: 1, evidence: 'supportive'
  },
  {
    id: 'mile-600', name: 'Mile-pace 600s', category: 'racepace', zones: ['mile'],
    tags: ['specific','1600','mile'],
    prescription: '4–6 × 600m near mile pace with 2:30–4:00 recovery.',
    repDistance: 600, reps: [4,6], restSeconds: [150,240], load: 5, minExperience: 2, evidence: 'supportive'
  },
  {
    id: '800-300', name: '800-pace 300s', category: 'racepace', zones: ['800'],
    tags: ['specific','800'],
    prescription: '5–8 × 300m at goal 800 rhythm with full-enough recovery to preserve mechanics.',
    repDistance: 300, reps: [5,8], restSeconds: [120,240], load: 5, minExperience: 1, evidence: 'supportive'
  },
  {
    id: '800-200', name: '800 rhythm 200s', category: 'racepace', zones: ['800'],
    tags: ['specific','800','primer'],
    prescription: '6–10 × 200m at 800 rhythm, relaxed, 200m walk/jog or 90–150 sec.',
    repDistance: 200, reps: [6,10], restSeconds: [90,150], load: 4, minExperience: 1, evidence: 'supportive'
  },
  {
    id: 'speed-150', name: 'Relaxed fast 150s', category: 'speed', zones: ['repetition'],
    tags: ['mechanics','speed','base','build','specific','primer'],
    prescription: '4–8 × 150m fast but relaxed with full walk-back recovery.',
    repDistance: 150, reps: [4,8], restSeconds: [120,240], load: 3, minExperience: 1, evidence: 'supportive'
  },
  {
    id: 'speed-200', name: 'Fast relaxed 200s', category: 'speed', zones: ['repetition'],
    tags: ['mechanics','speed','specific','800','1600'],
    prescription: '4–8 × 200m faster than mile pace, full recovery, stop if mechanics deteriorate.',
    repDistance: 200, reps: [4,8], restSeconds: [150,300], load: 4, minExperience: 2, evidence: 'supportive'
  },
  {
    id: 'hill-short', name: 'Short hill sprints', category: 'hills', zones: ['repetition'],
    tags: ['mechanics','power','base','build'],
    prescription: '6–10 × 8–12 sec steep hill, full walk-back recovery; crisp, not exhaustive.',
    load: 2, minExperience: 1, evidence: 'supportive'
  },
  {
    id: 'hill-long', name: 'Long hill reps', category: 'hills', zones: ['vo2'],
    tags: ['strength-endurance','base','build'],
    prescription: '6–10 × 45–75 sec uphill at strong controlled effort, jog down recovery.',
    load: 4, minExperience: 1, evidence: 'supportive'
  },
  {
    id: 'fartlek-1on1off', name: '1 on / 1 off fartlek', category: 'fartlek', zones: ['cv','vo2'],
    tags: ['aerobic-power','base','build'],
    prescription: '10–16 × 1 min strong / 1 min easy. Strong reps stay controlled and repeatable.',
    load: 3, minExperience: 0, evidence: 'supportive'
  },
  {
    id: 'fartlek-ladder', name: 'Aerobic fartlek ladder', category: 'fartlek', zones: ['threshold','cv'],
    tags: ['aerobic-power','base','build'],
    prescription: '1-2-3-4-3-2-1 min strong with equal or half-time easy recoveries.',
    load: 4, minExperience: 1, evidence: 'supportive'
  },
  {
    id: 'alternations', name: 'Threshold alternations', category: 'threshold', zones: ['steady','threshold'],
    tags: ['threshold','specific'],
    prescription: 'Alternate 2–3 min around threshold with 1 min steady float; 18–30 min total.',
    load: 4, minExperience: 2, evidence: 'supportive'
  },
  {
    id: 'broken-mile', name: 'Broken mile', category: 'racepace', zones: ['mile'],
    tags: ['specific','1600','mile'],
    prescription: 'Example structure: 600 + 500 + 400 + 300 with controlled recoveries; total quality near race distance.',
    load: 5, minExperience: 3, evidence: 'coaching-practice'
  },
  {
    id: 'broken-800', name: 'Broken 800', category: 'racepace', zones: ['800'],
    tags: ['specific','800'],
    prescription: 'Example structure: 400 + 300 + 200 with generous recovery, race-rhythm emphasis.',
    load: 5, minExperience: 3, evidence: 'coaching-practice'
  },
  {
    id: 'primer-distance', name: 'Distance race primer', category: 'primer', zones: ['5k','3k','repetition'],
    tags: ['primer','peak','taper','3200','5000'],
    prescription: 'Short easy run + a few strides + 3–5 short reps around race pace with full recovery. Finish feeling better than you started.',
    load: 2, minExperience: 0, evidence: 'coaching-practice'
  },
  {
    id: 'primer-middle', name: 'Middle-distance primer', category: 'primer', zones: ['mile','800','repetition'],
    tags: ['primer','peak','taper','800','1600','mile'],
    prescription: 'Short easy run + strides + 2–4 brief race-rhythm reps with full recovery. Low volume, high quality.',
    load: 2, minExperience: 0, evidence: 'coaching-practice'
  },
  {
    id: 'recovery', name: 'Recovery run', category: 'recovery', zones: ['recovery'],
    tags: ['recovery','all'],
    prescription: 'Very easy conversational running, or replace with rest if fatigue is elevated.',
    load: 1, minExperience: 0, evidence: 'strong'
  },
  {
    id: 'rest', name: 'Rest / mobility', category: 'rest', zones: [],
    tags: ['recovery','all'],
    prescription: 'No running required. Normal mobility and daily activity only.',
    load: 0, minExperience: 0, evidence: 'strong'
  }
];

export const SCIENCE = [
  {
    id: 'tid-runners-2021',
    title: 'Training-intensity Distribution on Middle- and Long-distance Runners: A Systematic Review',
    year: 2021,
    takeaway: 'Successful running programs generally keep most volume low intensity and a minority at threshold/high intensity.',
    doi: '10.1055/a-1559-3623',
    url: 'https://pubmed.ncbi.nlm.nih.gov/34749417/',
    evidence: 'systematic-review'
  },
  {
    id: 'periodization-2018',
    title: 'The Effect of Periodization and Training Intensity Distribution on Middle- and Long-Distance Running Performance',
    year: 2018,
    takeaway: 'Pyramidal and polarized structures are well supported; race-pace work can be layered within a broader intensity distribution.',
    doi: '10.1123/ijspp.2017-0327',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29182410/',
    evidence: 'systematic-review'
  },
  {
    id: 'polarized-2024',
    title: 'Comparison of Polarized Versus Other Types of Endurance Training Intensity Distribution',
    year: 2024,
    takeaway: 'Polarized training may improve VO₂peak in some trained populations, while time-trial outcomes are often similar to other sensible distributions.',
    doi: '10.1007/s40279-024-02034-z',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38717713/',
    evidence: 'meta-analysis'
  },
  {
    id: 'taper-2007',
    title: 'Effects of tapering on performance: a meta-analysis',
    year: 2007,
    takeaway: 'Tapers work best by reducing volume while preserving some intensity and frequency.',
    doi: '10.1249/mss.0b013e31806010e0',
    url: 'https://pubmed.ncbi.nlm.nih.gov/17762369/',
    evidence: 'meta-analysis'
  },
  {
    id: 'critical-speed-2026',
    title: "The Measurement and Application of Critical Speed and D' in Running: A Scoping Review",
    year: 2026,
    takeaway: 'Critical speed and D′ can individualize training and help model middle- and long-distance performance, but protocol choice matters.',
    doi: '10.1007/s40279-026-02410-x',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41931241/',
    evidence: 'scoping-review'
  },
  {
    id: 'critical-speed-2016',
    title: 'Applying the Critical Speed Concept to Racing Strategy and Interval Training Prescription',
    year: 2016,
    takeaway: 'Multiple PRs can be used to estimate an athlete-specific speed-duration relationship for interval prescription.',
    doi: '10.1123/ijspp.2016-0001',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27197057/',
    evidence: 'review'
  },
  {
    id: 'strength-2016',
    title: 'Effects of Strength Training on Running Economy in Highly Trained Runners',
    year: 2016,
    takeaway: 'Appropriately programmed strength/plyometric work can improve running economy when added to run training.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26694507/',
    evidence: 'meta-analysis'
  },
  {
    id: 'adolescent-strength-2018',
    title: 'Effects of Strength Training on Postpubertal Adolescent Distance Runners',
    year: 2018,
    takeaway: 'Strength training can be useful for postpubertal adolescent runners when appropriately supervised and integrated.',
    doi: '10.1249/MSS.0000000000001543',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29315164/',
    evidence: 'randomized-trial'
  },
  {
    id: 'lactate-guided-threshold-2023',
    title: 'Lactate-Guided Threshold Interval Training Within a High-Volume Low-Intensity Approach',
    year: 2023,
    takeaway: 'A Norwegian-style threshold-density model uses repeated controlled threshold sessions inside a much larger low-intensity program; it is an elite-practice model, not a default prescription for developing runners.',
    doi: '10.3390/ijerph20053782',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36900796/',
    evidence: 'review'
  },
  {
    id: 'split-moderate-intensity-2024',
    title: 'Acute Physiological Responses Between One Long and Two Short Moderate-Intensity Sessions',
    year: 2024,
    takeaway: 'Splitting matched moderate-intensity work into two sessions reduced several acute stress markers versus one long session in trained endurance athletes, while long-term superiority remains unproven.',
    doi: '10.3389/fphys.2024.1428536',
    url: 'https://pubmed.ncbi.nlm.nih.gov/39139482/',
    evidence: 'crossover-trial'
  },
  {
    id: 'norwegian-coaches-2025',
    title: 'Best-Practice Training Characteristics Within Olympic Endurance Sports as Described by Norwegian World-Class Coaches',
    year: 2025,
    takeaway: 'World-class Norwegian coaches commonly combine high low-intensity volume with a limited number of intensive days; some use two controlled threshold sessions on the same day to accumulate quality while managing recovery.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40278987/',
    evidence: 'qualitative-best-practice'
  }
];

export const DEMO_PROFILE = {
  name: 'Brandon',
  age: 16,
  experienceYears: 3,
  units: 'mi',
  currentMileage: 34,
  maxMileage: 48,
  preferredLongDay: 0,
  trainingStyle: 'standard',
  goal: {
    eventId: '800',
    seconds: 116,
    date: '2027-05-29',
    label: 'Championship 800m'
  },
  prs: [
    { eventId: '800', distance: 800, seconds: 122.34, date: '2026-05-14' },
    { eventId: '3200', distance: 3200, seconds: 676, date: '2026-10-01' },
    { eventId: '5000', distance: 5000, seconds: 1045, date: '2026-10-01' }
  ],
  races: [
    { id: 'r1', name: 'Conference', date: '2027-05-14', distance: 800, importance: 'A' },
    { id: 'r2', name: 'Sectional', date: '2027-05-21', distance: 800, importance: 'A' },
    { id: 'r3', name: 'State', date: '2027-05-29', distance: 800, importance: 'A' }
  ]
};
