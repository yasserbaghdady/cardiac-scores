/* ===== Field registry, derived values and score definitions =====
   Every score is data: which inputs it reads, how it computes, how it is classified,
   the guideline action, its source and its validation status. The UI renders all of
   them with one engine, so adding a score means adding one entry here plus its tests. */
var DEF = (function () {
  var CHECKED = '2026-11-07';

  /* ---------- fields (stored internally in mg/dL, kg, cm, mmHg) ---------- */
  function N(label, unit, o) { o = o || {}; o.type = 'num'; o.label = label; o.unit = unit; return o; }
  function B(label, o) { o = o || {}; o.type = 'bool'; o.label = label; return o; }
  function C(label, opts, o) { o = o || {}; o.type = 'choice'; o.label = label; o.opts = opts; return o; }
  var CHOL = { unit: 'mmol/L', f: 1 / 38.67, dp: 2 }, TG = { unit: 'mmol/L', f: 1 / 88.57, dp: 2 }, CR = { unit: 'µmol/L', f: 88.4, dp: 0 };

  var F = {
    age: N('Age', 'yrs', { g: 'demo', min: 18, max: 110, step: 1 }),
    sex: C('Sex', [['male', 'Male'], ['female', 'Female']], { g: 'demo' }),
    wt: N('Weight', 'kg', { g: 'demo', min: 25, max: 300 }),
    ht: N('Height', 'cm', { g: 'demo', min: 120, max: 230, step: 1 }),

    sbp: N('Systolic BP', 'mmHg', { g: 'vit', min: 50, max: 260, step: 1 }),
    dbp: N('Diastolic BP', 'mmHg', { g: 'vit', min: 20, max: 160, step: 1 }),
    hr: N('Heart rate', 'bpm', { g: 'vit', min: 20, max: 250, step: 1 }),
    rr: N('Respiratory rate', '/min', { g: 'vit', min: 4, max: 60, step: 1 }),
    temp: N('Temperature', '°C', { g: 'vit', min: 30, max: 43 }),
    spo2: N('SpO₂', '%', { g: 'vit', min: 40, max: 100, step: 1 }),

    tc: N('Total cholesterol', 'mg/dL', { g: 'lip', si: CHOL, min: 50, max: 600, step: 1 }),
    hdl: N('HDL', 'mg/dL', { g: 'lip', si: CHOL, min: 10, max: 200, step: 1 }),
    tg: N('Triglycerides', 'mg/dL', { g: 'lip', si: TG, min: 20, max: 3000, step: 1 }),
    ldl: N('LDL (measured)', 'mg/dL', { g: 'lip', si: CHOL, min: 10, max: 500, step: 1 }),

    cr: N('Creatinine', 'mg/dL', { g: 'ren', si: CR, min: 0.2, max: 20 }),
    uacr: N('UACR', 'mg/g', { g: 'ren', min: 0, max: 10000 }),
    hba1c: N('HbA1c', '%', { g: 'ren', min: 3, max: 20 }),
    hscrp: N('hsCRP', 'mg/L', { g: 'ren', min: 0, max: 300 }),

    hb: N('Haemoglobin', 'g/dL', { g: 'bld', si: { unit: 'g/L', f: 10, dp: 0 }, min: 3, max: 25 }),
    hct: N('Haematocrit', '%', { g: 'bld', min: 10, max: 70 }),
    wbc: N('White cells', '×10⁹/L', { g: 'bld', min: 0.5, max: 100 }),
    plt: N('Platelets', '×10⁹/L', { g: 'bld', min: 5, max: 1500, step: 1 }),

    smoker: B('Current smoker', { g: 'rf' }),
    dm: B('Diabetes', { g: 'rf' }),
    dmAge: N('Age at diabetes diagnosis', 'yrs', { g: 'rf', min: 1, max: 110, step: 1, show: function (s) { return !!s.dm; } }),
    insulin: B('On insulin', { g: 'rf', show: function (s) { return !!s.dm; } }),
    htn: B('Hypertension', { g: 'rf' }),
    lipid: B('Hypercholesterolaemia', { g: 'rf' }),
    famhx: B('Family history of premature CVD', { g: 'rf' }),

    cad: B('Coronary artery disease', { g: 'hx' }),
    cevd: B('Stroke / TIA / cerebrovascular', { g: 'hx' }),
    pad: B('Peripheral artery disease', { g: 'hx' }),
    aaa: B('Aortic aneurysm', { g: 'hx' }),
    hf: B('Heart failure / LV dysfunction', { g: 'hx' }),
    priorBleed: B('Prior major bleeding', { g: 'hx' }),
    af: B('Atrial fibrillation', { g: 'hx' }),
    cancer: B('Active malignancy', { g: 'hx' }),
    copd: B('Chronic lung disease', { g: 'hx' }),
    nyha: C('NYHA class', [['', 'Not assessed'], ['1', 'I'], ['2', 'II'], ['3', 'III'], ['4', 'IV']], { g: 'hx', def: '' }),

    ef: N('LV ejection fraction', '%', { g: 'ech', min: 5, max: 85, step: 1 }),
    eePrime: N('E/e′ (average)', '', { g: 'ech', min: 2, max: 50 }),
    ePrimeSept: N('e′ septal', 'cm/s', { g: 'ech', min: 1, max: 25 }),
    ePrimeLat: N('e′ lateral', 'cm/s', { g: 'ech', min: 1, max: 30 }),
    lavi: N('LA volume index', 'mL/m²', { g: 'ech', min: 5, max: 150 }),
    trv: N('TR velocity', 'm/s', { g: 'ech', min: 1, max: 6 }),
    pasp: N('PA systolic pressure', 'mmHg', { g: 'ech', min: 10, max: 150, step: 1 }),
    lvmi: N('LV mass index', 'g/m²', { g: 'ech', min: 30, max: 350, step: 1 }),
    rwt: N('Relative wall thickness', '', { g: 'ech', min: 0.1, max: 1.2 }),
    wallThick: N('Max wall thickness', 'mm', { g: 'ech', min: 4, max: 40 }),
    gls: N('GLS (absolute)', '%', { g: 'ech', min: 2, max: 30 }),
    laDiam: N('LA diameter', 'mm', { g: 'ech', min: 15, max: 90, step: 1 }),
    lvotGrad: N('Max LVOT gradient', 'mmHg', { g: 'ech', min: 0, max: 250, step: 1 }),

    ntprobnp: N('NT-proBNP', 'pg/mL', { g: 'ren', min: 5, max: 70000, step: 1 }),
    bnp: N('BNP', 'pg/mL', { g: 'ren', min: 2, max: 20000, step: 1 }),


    bptx: B('BP treatment', { g: 'rx' }),
    statin: B('Statin', { g: 'rx' }),
    antiplatelet: B('Antiplatelet', { g: 'rx' }),
    anticoag: B('Anticoagulant', { g: 'rx' }),
    nsaid: B('NSAID', { g: 'rx' }),
    bblocker: B('Beta blocker', { g: 'rx' }),
    acei: B('ACE inhibitor or ARB', { g: 'rx' }),

    killip: C('Killip class', [['1', 'I'], ['2', 'II'], ['3', 'III'], ['4', 'IV']], { g: 'acs', def: '1' }),
    arrest: B('Cardiac arrest at admission', { g: 'acs' }),
    stdev: B('ST deviation', { g: 'acs' }),
    enz: B('Raised troponin', { g: 'acs' }),

    /* score-specific (shown on the score card, not in the profile) */
    ascvdYrs: N('Years since first ASCVD event', 'yrs', { local: 1, min: 0, max: 80 }),
    s2region: C('SMART2 calibration', [['veryhigh', 'Very high (Egypt)'], ['high', 'High'], ['moderate', 'Moderate'], ['low', 'Low']], { local: 1, def: 'veryhigh' }),
    smAT: C('Antithrombotic', [['none', 'None'], ['aspirin', 'Single antiplatelet'], ['dapt', 'DAPT'], ['aspdoac', 'Aspirin + low-dose rivaroxaban']], { local: 1, autoDef: function (s) { return s.antiplatelet || s.anticoag ? 'aspirin' : 'none'; } }),
    embolism: B('Prior systemic embolism', { local: 1 }),
    vasc: B('Vascular disease (MI, PAD, aortic plaque)', { local: 1, auto: function (s) { return !!(s.cad || s.pad); } }),
    hUnc: B('Uncontrolled HTN (SBP > 160)', { local: 1, auto: function (s) { return s.sbp > 160; } }),
    renalDis: B('Renal disease (dialysis, transplant, Cr > 2.26)', { local: 1, auto: function (s) { return s.cr > 2.26; } }),
    liverDis: B('Liver disease (cirrhosis, bilirubin > 2×, AST/ALT > 3×)', { local: 1 }),
    labile: B('Labile INR (TTR < 60%)', { local: 1 }),
    bleedDrugs: B('Antiplatelet or NSAID', { local: 1, auto: function (s) { return !!(s.antiplatelet || s.nsaid); } }),
    alcohol: B('Alcohol ≥ 8 drinks/week', { local: 1 }),
    indication: C('Indication', [['af', 'AF'], ['vte', 'VTE treatment']], { local: 1, def: 'af' }),
    drug: C('DOAC', [['apixaban', 'Apixaban'], ['rivaroxaban', 'Rivaroxaban']], { local: 1, def: 'apixaban' }),
    liverCP: C('Liver (Child-Pugh)', [['none', 'None'], ['A', 'A'], ['B', 'B'], ['C', 'C']], { local: 1, def: 'none' }),
    inhibitor: B('Strong CYP3A4 + P-gp inhibitor', { local: 1 }),
    inducer: B('Strong CYP3A4 / P-gp inducer', { local: 1 }),
    knownCAD: B('Known CAD (stenosis ≥ 50%)', { local: 1, auto: function (s) { return !!s.cad; } }),
    asa: B('Aspirin in past 7 days', { local: 1, auto: function (s) { return !!s.antiplatelet; } }),
    angina2: B('≥ 2 angina episodes in 24 h', { local: 1 }),
    anginaHx: B('History of angina', { local: 1 }),
    antLBBB: B('Anterior STE or LBBB', { local: 1 }),
    late: B('Time to treatment > 4 h', { local: 1 }),
    highRiskSurg: B('High-risk surgery (intraperitoneal, intrathoracic, suprainguinal vascular)', { local: 1, auto: function (s) { return ['H:aortic', 'H:pancreas', 'H:liver', 'H:oesoph', 'H:bowel', 'H:pneumo', 'H:tx', 'H:adrenal', 'H:cystectomy', 'I:ip', 'I:thoracic', 'I:evar', 'L:vats'].indexOf(s.surgProc) > -1; } }),
    ihd: B('Ischaemic heart disease', { local: 1, auto: function (s) { return !!s.cad; } }),
    urgency: C('Timing of surgery', [['elective', 'Elective'], ['timesens', 'Time-sensitive'], ['urgent', 'Urgent / emergency']], { local: 1, def: 'elective' }),
    surgProc: C('Procedure (ESC 2022 list)', [['', 'Choose procedure…'],
      ['L:breast', 'Breast'], ['L:dental', 'Dental'], ['L:endocrine', 'Endocrine: thyroid'], ['L:eye', 'Eye'], ['L:gynminor', 'Gynaecological: minor'],
      ['L:orthominor', 'Orthopaedic minor (meniscectomy)'], ['L:recon', 'Reconstructive'], ['L:superficial', 'Superficial surgery'], ['L:urominor', 'Urological minor (TURP)'], ['L:vats', 'VATS minor lung resection'],
      ['I:carotidasx', 'Carotid asymptomatic (CEA or CAS)'], ['I:ceasx', 'Carotid symptomatic (CEA)'], ['I:evar', 'Endovascular aortic aneurysm repair'], ['I:headneck', 'Head and neck surgery'],
      ['I:ip', 'Intraperitoneal: splenectomy, hiatal hernia repair, cholecystectomy'], ['I:thoracic', 'Intrathoracic: non-major'], ['I:neuroortho', 'Neurological or orthopaedic: major (hip and spine)'],
      ['I:pta', 'Peripheral arterial angioplasty'], ['I:renaltx', 'Renal transplant'], ['I:urogynmajor', 'Urological or gynaecological: major'],
      ['H:adrenal', 'Adrenal resection'], ['H:aortic', 'Aortic and major vascular surgery'], ['H:cas', 'Carotid symptomatic (CAS)'], ['H:pancreas', 'Duodenal-pancreatic surgery'],
      ['H:liver', 'Liver resection, bile duct surgery'], ['H:oesoph', 'Oesophagectomy'], ['H:limb', 'Open lower-limb revascularisation for acute limb ischaemia, or amputation'],
      ['H:pneumo', 'Pneumonectomy (VATS or open)'], ['H:tx', 'Pulmonary or liver transplant'], ['H:bowel', 'Repair of perforated bowel'], ['H:cystectomy', 'Total cystectomy']], { local: 1, def: '' }),
    cvSymptoms: B('Symptoms or signs suggesting CVD (dyspnoea, chest pain, murmur)', { local: 1 }),
    valve: B('Known significant valve disease', { local: 1 }),
    bnpHigh: B('Raised NT-proBNP (> 300 pg/mL) or BNP (> 92 pg/mL)', { local: 1 }),
    poorFC: B('Poor functional capacity (< 4 METs, cannot climb 2 flights)', { local: 1, auto: function (s) { return dasiOf(s).done && dasiOf(s).mets < 4; } }),
    dasi1: B('Take care of yourself (eat, dress, bathe, toilet)', { local: 1 }),
    dasi2: B('Walk indoors, such as around the house', { local: 1 }),
    dasi3: B('Walk a block or two on level ground', { local: 1 }),
    dasi4: B('Climb a flight of stairs or walk up a hill', { local: 1 }),
    dasi5: B('Run a short distance', { local: 1 }),
    dasi6: B('Light housework (dusting, washing dishes)', { local: 1 }),
    dasi7: B('Moderate housework (vacuuming, sweeping, carrying groceries)', { local: 1 }),
    dasi8: B('Heavy housework (scrubbing floors, lifting or moving furniture)', { local: 1 }),
    dasi9: B('Yard work (raking leaves, weeding, pushing a mower)', { local: 1 }),
    dasi10: B('Have sexual relations', { local: 1 }),
    dasi11: B('Moderate recreation (golf, bowling, dancing, doubles tennis)', { local: 1 }),
    dasi12: B('Strenuous sports (swimming, singles tennis, football, skiing)', { local: 1 }),
    guptaFS: C('Functional status', [['indep', 'Independent'], ['partial', 'Partially dependent'], ['total', 'Totally dependent']], { local: 1, def: 'indep' }),
    asaClass: C('ASA class', [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']], { local: 1, def: '2' }),
    guptaProc: C('Type of procedure', [['', 'Choose procedure…'], ['anorectal', 'Anorectal'], ['aortic', 'Aortic'], ['bariatric', 'Bariatric'], ['brain', 'Brain'], ['breast', 'Breast'], ['cardiac', 'Cardiac'],
      ['ent', 'ENT (except thyroid/parathyroid)'], ['foregut', 'Foregut or hepatopancreatobiliary'], ['gallbladder', 'Gallbladder, appendix, adrenals or spleen'], ['hernia', 'Hernia (ventral, inguinal, femoral)'],
      ['intestinal', 'Intestinal'], ['neck', 'Neck (thyroid/parathyroid)'], ['obgyn', 'Obstetric/gynaecologic'], ['ortho', 'Orthopaedic and non-vascular extremity'], ['otherabd', 'Other abdominal'],
      ['pv', 'Peripheral vascular (non-aortic, non-vein)'], ['skin', 'Skin'], ['spine', 'Spine'], ['thoracic', 'Non-oesophageal thoracic'], ['vein', 'Vein'], ['urology', 'Urology']], { local: 1, def: '' }),
    heartHx: C('History', [['0', 'Slightly suspicious'], ['1', 'Moderately suspicious'], ['2', 'Highly suspicious']], { local: 1 }),
    heartEcg: C('ECG', [['0', 'Normal'], ['1', 'Non-specific repolarisation'], ['2', 'Significant ST deviation']], { local: 1, autoDef: function (s) { return s.stdev ? '2' : null; } }),
    heartTn: C('Troponin', [['0', '≤ normal limit'], ['1', '1–3× normal limit'], ['2', '> 3× normal limit']], { local: 1 }),
    chfSigns: B('Signs of heart failure at presentation', { local: 1, auto: function (s) { return +s.killip >= 2; } }),
    priorVasc: B('Prior vascular disease (PAD or stroke)', { local: 1, auto: function (s) { return !!(s.pad || s.cevd); } }),
    tnAssay: C('Troponin assay', [['elecsys', 'hs-cTnT Elecsys (Roche)'], ['architect', 'hs-cTnI Architect (Abbott)'], ['centaur', 'hs-cTnI Centaur (Siemens)'], ['access', 'hs-cTnI Access (Beckman Coulter)'],
      ['clarity', 'hs-cTnI Clarity (Singulex)'], ['vitros', 'hs-cTnI Vitros (Ortho)'], ['pathfast', 'hs-cTnI Pathfast (LSI Medience)'], ['triage', 'hs-cTnI TriageTrue (Quidel)'], ['dimension', 'hs-cTnI Dimension EXL (Siemens)']], { local: 1, def: 'elecsys' }),
    tn0: N('Troponin at 0 h', 'ng/L', { local: 1, min: 0, max: 100000 }),
    tn1: N('Troponin at 1 h', 'ng/L', { local: 1, min: 0, max: 100000 }),
    onset3h: B('Chest pain onset more than 3 h ago', { local: 1 }),
    pdBleed: B('Prior spontaneous bleeding', { local: 1, auto: function (s) { return !!s.priorBleed; } }),
    arcOAC: B('Long-term oral anticoagulation', { local: 1, auto: function (s) { return !!s.anticoag; } }),
    arcBleedMaj: B('Spontaneous bleeding needing hospitalisation or transfusion in past 6 months, or recurrent', { local: 1 }),
    arcDiath: B('Chronic bleeding diathesis', { local: 1 }),
    arcCirr: B('Liver cirrhosis with portal hypertension', { local: 1 }),
    arcCancer: B('Active malignancy in past 12 months (not non-melanoma skin)', { local: 1, auto: function (s) { return !!s.cancer; } }),
    arcICH: B('Spontaneous ICH ever, traumatic ICH in past 12 months, or brain AVM', { local: 1 }),
    arcStrokeMaj: B('Moderate or severe ischaemic stroke in past 6 months', { local: 1 }),
    arcSurg: B('Non-deferrable major surgery on DAPT, or major surgery or trauma in past 30 days', { local: 1 }),
    arcBleedMin: B('Minor: bleeding needing hospitalisation or transfusion 6–12 months ago', { local: 1 }),
    arcNsaid: B('Minor: long-term NSAIDs or steroids', { local: 1, auto: function (s) { return !!s.nsaid; } }),
    arcStrokeMin: B('Minor: any other ischaemic stroke', { local: 1 }),
    mHypo: B('Hypotension (SBP < 80 for ≥ 1 h needing inotropes or IABP)', { local: 1 }),
    mIABP: B('Intra-aortic balloon pump', { local: 1 }),
    mCHF: B('Heart failure NYHA III–IV or pulmonary oedema', { local: 1 }),
    contrast: N('Contrast volume', 'mL', { local: 1, min: 0, max: 1500, step: 10 }),
    euDial: B('On dialysis', { local: 1 }),
    euArt: B('Extracardiac arteriopathy', { local: 1, auto: function (s) { return !!s.pad; } }),
    euMob: B('Poor mobility', { local: 1 }),
    euPrev: B('Previous cardiac surgery', { local: 1 }),
    euLung: B('Chronic lung disease', { local: 1, auto: function (s) { return !!s.copd; } }),
    euEndo: B('Active endocarditis', { local: 1 }),
    euCrit: B('Critical pre-operative state', { local: 1 }),
    euIDDM: B('Diabetes on insulin', { local: 1, auto: function (s) { return !!(s.dm && s.insulin); } }),
    euCCS4: B('CCS class 4 angina', { local: 1 }),
    euMI: B('MI within 90 days', { local: 1 }),
    euAorta: B('Surgery on thoracic aorta', { local: 1 }),
    euNyha: C('NYHA class', [['1', 'I'], ['2', 'II'], ['3', 'III'], ['4', 'IV']], { local: 1, autoDef: function (s) { return s.nyha || '1'; } }),
    euLV: C('LV function', [['good', 'Good (> 50%)'], ['mod', 'Moderate (31–50%)'], ['poor', 'Poor (21–30%)'], ['vpoor', 'Very poor (≤ 20%)']], { local: 1, autoDef: function (s) { return s.ef == null ? 'good' : s.ef > 50 ? 'good' : s.ef > 30 ? 'mod' : s.ef > 20 ? 'poor' : 'vpoor'; } }),
    euPH: C('PA systolic pressure', [['none', '< 31 mmHg'], ['mod', '31–55 mmHg'], ['sev', '> 55 mmHg']], { local: 1, def: 'none' }),
    euUrg: C('Urgency', [['elective', 'Elective'], ['urgent', 'Urgent'], ['emergency', 'Emergency'], ['salvage', 'Salvage']], { local: 1, def: 'elective' }),
    euWt: C('Weight of procedure', [['cabg', 'Isolated CABG'], ['single', 'Single non-CABG'], ['two', '2 procedures'], ['three', '3 or more']], { local: 1, def: 'cabg' }),
    qt: N('QT interval', 'ms', { local: 1, min: 200, max: 800, step: 1 }),
    hf18: B('Heart failure first diagnosed 18 months ago or more', { local: 1 }),
    peDvtSigns: B('Clinical signs of DVT', { local: 1 }),
    peLikely: B('PE is the most likely diagnosis', { local: 1 }),
    peImmob: B('Immobilisation 3 days or more, or surgery in past 4 weeks', { local: 1 }),
    priorVTE: B('Previous PE or DVT', { local: 1 }),
    haemoptysis: B('Haemoptysis', { local: 1 }),
    dvtParalysis: B('Paralysis, paresis or recent plaster cast', { local: 1 }),
    dvtBedridden: B('Bedridden 3 days or more, or major surgery in past 12 weeks', { local: 1 }),
    dvtTender: B('Tenderness along the deep veins', { local: 1 }),
    dvtLegSwollen: B('Entire leg swollen', { local: 1 }),
    dvtCalf3: B('Calf more than 3 cm larger than the other side', { local: 1 }),
    dvtPitting: B('Pitting oedema in the symptomatic leg only', { local: 1 }),
    dvtCollateral: B('Collateral superficial veins (not varicose)', { local: 1 }),
    priorDVT: B('Previously documented DVT', { local: 1, auto: function (s) { return !!s.priorVTE; } }),
    dvtAltDx: B('Alternative diagnosis at least as likely (−2)', { local: 1 }),
    altered: B('Altered mental status', { local: 1 }),
    haemoUnstable: B('Haemodynamic instability (arrest, obstructive shock or persistent hypotension)', { local: 1 }),
    rvDysfunction: B('RV dysfunction on echo or CT', { local: 1 }),
    peTroponin: B('Raised troponin', { local: 1, auto: function (s) { return !!s.enz; } }),
    famSCD: B('Family history of sudden cardiac death', { local: 1 }),
    nsvt: B('Non-sustained VT', { local: 1 }),
    unexpSyncope: B('Unexplained syncope', { local: 1 }),
    dukeMicro1: B('Major: typical organisms from 2 or more separate blood cultures', { local: 1 }),
    dukeMicro2: B('Major: persistently positive cultures, or Coxiella, Bartonella or T. whipplei', { local: 1 }),
    dukeImaging: B('Major: vegetation, abscess, pseudoaneurysm, new dehiscence, or abnormal PET/CT activity', { local: 1 }),
    dukeSurgical: B('Major: endocarditis confirmed at surgery or on pathology', { local: 1 }),
    dukePredispose: B('Minor: predisposing heart condition or injection drug use', { local: 1 }),
    dukeFever: B('Minor: fever above 38 °C', { local: 1 }),
    dukeVascular: B('Minor: vascular phenomena', { local: 1 }),
    dukeImmune: B('Minor: immunological phenomena', { local: 1 }),
    dukeMicroMinor: B('Minor: microbiological evidence short of a major criterion', { local: 1 }),
    dukeImagingMinor: B('Minor: imaging evidence short of a major criterion', { local: 1 }),
    dukePhysExam: B('Minor: new valvular regurgitation on examination', { local: 1 }),
    twoAntiHTN: B('On 2 or more antihypertensive medicines', { local: 1 }),
    convVal: N('Value', '', { local: 1, nosi: 1 }),
    convAn: C('Test', [['chol', 'Cholesterol'], ['tg', 'Triglycerides'], ['cr', 'Creatinine'], ['glu', 'Glucose'], ['hb', 'Haemoglobin']], { local: 1, def: 'chol' }),
    convDir: C('Convert', [['toSI', 'Conventional → SI'], ['toConv', 'SI → conventional']], { local: 1, def: 'toSI' })
  };

  var GROUPS = [
    ['demo', 'Patient'], ['vit', 'Vital signs'], ['lip', 'Lipids'], ['ren', 'Kidney and labs'], ['bld', 'Blood count'],
    ['rf', 'Risk factors'], ['hx', 'Cardiac and vascular history'], ['ech', 'Echocardiogram'], ['rx', 'Current medicines'], ['acs', 'Acute coronary presentation']
  ];

  /* ---------- value access ---------- */
  function val(s, k) {                    // effective value: explicit entry, else auto rule, else default
    var f = F[k], v = s[k];
    if (f.type === 'num') { v = parseFloat(v); return isNaN(v) ? null : v; }
    if (f.type === 'bool') { if (v === true || v === false) return v; return f.auto ? !!f.auto(raw(s)) : false; }
    return v != null && v !== '' ? v : (f.autoDef ? f.autoDef(raw(s)) : (f.def || null));
  }
  function raw(s) { var o = {}; for (var k in F) if (F[k].type === 'num') { var n = parseFloat(s[k]); o[k] = isNaN(n) ? null : n; } else o[k] = s[k]; return o; }
  function isAuto(s, k) { var f = F[k]; return f.type === 'bool' && f.auto && s[k] !== true && s[k] !== false && !!f.auto(raw(s)); }
  function all(s) { var o = {}; for (var k in F) o[k] = val(s, k); return o; }

  function derive(p) {
    var d = {};
    d.egfr = (p.cr && p.age && p.sex) ? RS.egfr(p.cr, p.age, p.sex) : null;
    d.crcl = (p.sex) ? UT.crcl(p.cr, p.age, p.sex, p.wt) : null;
    d.bmi = RS.bmi(p.wt, p.ht);
    d.bsa = UT.bsa(p.wt, p.ht);
    d.nonhdl = (p.tc && p.hdl) ? p.tc - p.hdl : null;
    d.ldlF = UT.friedewald(p.tc, p.hdl, p.tg);
    d.ldlS = UT.sampson(p.tc, p.hdl, p.tg);
    d.map = UT.map(p.sbp, p.dbp);
    d.pp = (p.sbp && p.dbp) ? p.sbp - p.dbp : null;
    d.ascvd = !!(p.cad || p.cevd || p.pad || p.aaa);
    d.paspEst = p.pasp == null && p.trv != null;
    d.pasp = p.pasp != null ? p.pasp : (p.trv != null ? 4 * p.trv * p.trv + 5 : null);
    d.trv = p.trv != null ? p.trv : (p.pasp != null && p.pasp > 5 ? Math.sqrt((p.pasp - 5) / 4) : null);
    d.hctEst = p.hct == null && p.hb != null;
    d.hct = p.hct != null ? p.hct : (p.hb != null ? p.hb * 3 : null);
    return d;
  }

  /* ---------- helpers ---------- */
  var f1 = function (x) { return (Math.round(x * 10) / 10).toFixed(1); };
  var f0 = function (x) { return String(Math.round(x)); };
  function need(p, keys) { return keys.filter(function (k) { return p[k] == null || p[k] === ''; }); }
  function res(o) { o.ok = o.value != null; o.lines = o.lines || []; o.warn = o.warn || []; o.missing = o.missing || []; return o; }
  var CAT4 = ['Low', 'Moderate', 'High', 'Very high'];

  var DASI_W = [2.75, 1.75, 2.75, 5.50, 8.00, 2.70, 3.50, 8.00, 4.50, 5.25, 6.00, 7.50];
  function dasiOf(st) {
    var sc = 0, done = false;
    for (var i = 0; i < 12; i++) if (st['dasi' + (i + 1)] === true) { sc += DASI_W[i]; done = true; }
    var vo2 = 0.43 * sc + 9.6;
    return { score: sc, vo2: vo2, mets: vo2 / 3.5, done: done };
  }
  function surgCat(code) { return code ? code.split(':')[0] : null; }
  function procName(code) { var o = F.surgProc.opts.filter(function (x) { return x[0] === code; })[0]; return o ? o[1] : ''; }

  /* ---------- score definitions ---------- */
  var S = [];
  function add(d) { d.checked = d.checked || CHECKED; S.push(d); }

  /* ===== Prevention ===== */
  add({
    id: 'score2', name: 'SCORE2 family', domain: 'Prevention', scen: ['prev'],
    blurb: 'ESC 10-year fatal and non-fatal CVD. Picks SCORE2, SCORE2-OP or SCORE2-Diabetes automatically.',
    inputs: ['age', 'sex', 'sbp', 'tc', 'hdl', 'smoker', 'dm', 'dmAge', 'hba1c', 'cr', 'famhx'],
    calc: function (p, d) {
      if (d.ascvd) return res({ na: 'Established ASCVD in the profile: SCORE2 does not apply. Use SMART2.' });
      var m = need(p, ['age', 'sex', 'sbp', 'tc', 'hdl']);
      if (m.length) return res({ missing: m });
      var q = { age: p.age, sex: p.sex, sbp: p.sbp, tc: p.tc, hdl: p.hdl, smoker: p.smoker, dm: p.dm, dmAge: p.dmAge, hba1c: p.hba1c, egfr: d.egfr, famhx: p.famhx, ascvd: false };
      var r = RS.score2Auto(q);
      var miss = [];
      (r.missing || []).forEach(function (x) { miss.push(x.indexOf('diagnosis') > -1 ? 'dmAge' : x.indexOf('HbA1c') > -1 ? 'hba1c' : 'cr'); });
      if (r.value == null) return res({ model: r.model, missing: miss, na: miss.length ? null : r.note });
      var c = RS.riskCat(r.value), esc = r.model === 'SCORE2-Diabetes' ? null : RS.escAgeCat(r.value, p.age);
      var lines = ['Model: ' + r.model + ' · very-high-risk region (Egypt)'];
      if (r.mods.length) lines.push('Model ' + f1(r.raw) + '% · ' + r.mods.map(function (x) { return x.en; }).join(' · '));
      if (esc) lines.push('ESC 2021 age-specific category: ' + esc);
      if (r.note) lines.push(r.note);
      var act;
      if (r.model === 'SCORE2-Diabetes') act = c >= 3 ? 'Very high risk in diabetes: LDL goal < 55 mg/dL; consider SGLT2i or GLP-1 RA (ESC 2023).' : c === 2 ? 'High risk in diabetes: LDL goal < 70 mg/dL (ESC 2023).' : 'Moderate or low risk in diabetes: LDL goal < 100 mg/dL (ESC 2023).';
      else act = esc === 'very high' ? 'Risk-factor treatment recommended (ESC 2021, class I). LDL goal < 55 mg/dL.' :
        esc === 'high' ? 'Risk-factor treatment should be considered (ESC 2021, IIa). LDL goal < 70 mg/dL.' :
          'Risk-factor treatment generally not recommended; lifestyle advice (ESC 2021).';
      return res({ value: r.value, unit: '%', cat: c, catLabel: CAT4[c], lines: lines, action: act, model: r.model,
        summary: r.model + ' ' + f1(r.value) + '% (10-yr CVD, ' + CAT4[c].toLowerCase() + (esc ? '; ESC ' + esc : '') + ')' });
    },
    source: 'SCORE2 / SCORE2-OP working groups, Eur Heart J 2021; SCORE2-Diabetes, Eur Heart J 2023. eGFR and family-history multipliers as in the clinic tool.',
    status: 'verified', verifiedBy: 'MDCalc SCORE2, SCORE2-OP and SCORE2-Diabetes (10 patients, all within 0.1%) and the U-Prevent worked example'
  });

  add({
    id: 'smart2', name: 'SMART2', domain: 'Prevention', scen: ['prev'],
    blurb: '10-year recurrent MI, stroke or vascular death in established ASCVD.',
    inputs: ['age', 'sex', 'sbp', 'tc', 'hdl', 'cr', 'smoker', 'dm', 'hscrp', 'cad', 'cevd', 'pad', 'aaa', 'antiplatelet', 'anticoag'],
    local: ['smAT', 'ascvdYrs', 's2region'],
    calc: function (p, d) {
      if (!d.ascvd) return res({ na: 'For established ASCVD only. Tick CAD, cerebrovascular, PAD or aneurysm in the profile.' });
      var m = need(p, ['age', 'sex', 'sbp', 'tc', 'hdl', 'cr']);
      if (m.length) return res({ missing: m });
      var r = UT.smart2({ age: p.age, sex: p.sex, smoker: p.smoker, dm: p.dm, sbp: p.sbp, tc: p.tc, hdl: p.hdl, hscrp: p.hscrp, egfr: d.egfr,
        years: p.ascvdYrs || 0, cad: p.cad, cevd: p.cevd, pad: p.pad, aaa: p.aaa, at: p.smAT, region: p.s2region });
      var c = r.value < 20 ? 2 : 3, lines = [];
      if (r.crpImputed) lines.push('hsCRP not entered: median 2.0 mg/L assumed.');
      if (p.age < 40 || p.age > 80) lines.push('Validated for ages 40–80.');
      if (p.s2region === 'veryhigh') lines.push('No African calibration exists; the very-high-risk region is the closest match for Egypt.');
      return res({ value: r.value, unit: '%', cat: c, catLabel: c === 3 ? 'Very high' : 'High', lines: lines,
        action: 'Secondary prevention for all: LDL goal < 55 mg/dL with ≥ 50% reduction. A low result never justifies withholding indicated therapy.',
        summary: 'SMART2 ' + f1(r.value) + '% (10-yr recurrent events)' });
    },
    source: 'Hageman et al., Eur Heart J 2022 (SMART2), supplementary table 2; antithrombotic effects as applied by U-Prevent.',
    status: 'verified', verifiedBy: 'U-Prevent SMART2 (4 patients, all 4 regions and all 4 antithrombotic options)'
  });

  add({
    id: 'prevent', name: 'PREVENT', domain: 'Prevention', scen: ['prev'],
    blurb: 'AHA 2023 equations: 10- and 30-year total CVD, ASCVD and heart failure, ages 30–79.',
    inputs: ['age', 'sex', 'sbp', 'tc', 'hdl', 'cr', 'wt', 'ht', 'bptx', 'statin', 'dm', 'smoker', 'hba1c', 'uacr'],
    calc: function (p, d) {
      if (d.ascvd) return res({ na: 'Primary prevention only; established ASCVD in the profile.' });
      var m = need(p, ['age', 'sex', 'sbp', 'tc', 'hdl', 'cr', 'wt', 'ht']);
      if (m.length) return res({ missing: m });
      var r = RS.prevent({ age: p.age, sex: p.sex, sbp: p.sbp, tc: p.tc, hdl: p.hdl, dm: p.dm, smoker: p.smoker, egfr: d.egfr, bmi: d.bmi,
        bptx: p.bptx, statin: p.statin, hba1c: p.hba1c, uacr: p.uacr });
      if (!r.ok) return res({ na: r.warn.join(' ') });
      var y = r.y10, c = RS.preventCat(y.total_cvd), L = ['Low', 'Borderline', 'Intermediate', 'High'];
      var lines = ['10-yr ASCVD ' + f1(y.ascvd) + '% · heart failure ' + f1(y.heart_failure) + '%',
        'Model: ' + r.model + (r.model === 'full' ? ' (US deprivation index left as missing)' : '')];
      if (r.y30) lines.push('30-yr total CVD ' + f1(r.y30.total_cvd) + '% · ASCVD ' + f1(r.y30.ascvd) + '% · HF ' + f1(r.y30.heart_failure) + '%');
      lines.push('US-derived; not calibrated for Egyptian patients.');
      return res({ value: y.total_cvd, unit: '%', cat: c, catLabel: L[c], lines: lines, warn: r.warn.filter(function (w) { return w.indexOf('30-year') < 0; }),
        action: 'Use alongside SCORE2; in Egypt SCORE2 (very-high-risk region) remains the reference for decisions.',
        summary: 'PREVENT ' + f1(y.total_cvd) + '% 10-yr total CVD (' + L[c].toLowerCase() + ')' });
    },
    source: 'Khan et al., Circulation 2024 (PREVENT); HbA1c model as revised by the AHA on 14 Oct 2026.',
    status: 'verified', verifiedBy: 'the AHA PREVENT online calculator (3 patients incl. HbA1c and full models) and MDCalc PREVENT (base and UACR models)'
  });

  add({
    id: 'framingham', name: 'Framingham general CVD', domain: 'Prevention', scen: ['prev'],
    blurb: '10-year general CVD, ages 30–74. US-derived; for comparison.',
    inputs: ['age', 'sex', 'sbp', 'tc', 'hdl', 'bptx', 'smoker', 'dm'],
    calc: function (p, d) {
      if (d.ascvd) return res({ na: 'Primary prevention only.' });
      var m = need(p, ['age', 'sex', 'sbp', 'tc', 'hdl']);
      if (m.length) return res({ missing: m });
      if (p.age < 30 || p.age > 74) return res({ na: 'Validated for ages 30–74.' });
      var v = RS.framingham(p), c = v < 10 ? 0 : v < 20 ? 1 : 2;
      return res({ value: v, unit: '%', cat: c, catLabel: ['Low', 'Intermediate', 'High'][c], lines: ['D’Agostino 2008 categories: < 10% low, 10–19% intermediate, ≥ 20% high.'],
        summary: 'Framingham ' + f1(v) + '% 10-yr CVD' });
    },
    source: 'D’Agostino et al., Circulation 2008.',
    status: 'ported'
  });

  /* ===== Atrial fibrillation ===== */
  add({
    id: 'cha2ds2va', name: 'CHA₂DS₂-VA', domain: 'Atrial fibrillation', scen: ['af'],
    blurb: 'Stroke risk in AF (ESC 2024; sex no longer scored). CHA₂DS₂-VASc shown for reference.',
    inputs: ['age', 'sex', 'hf', 'htn', 'dm', 'cevd'], local: ['embolism', 'vasc'],
    calc: function (p) {
      var m = need(p, ['age']);
      if (m.length) return res({ missing: m });
      var c = RS.chads({ age: p.age, sex: p.sex, chf: p.hf, htn: p.htn, dm: p.dm, stroke: p.cevd || p.embolism, vasc: p.vasc });
      var cat = c.va === 0 ? 0 : c.va === 1 ? 1 : 3;
      var act = c.va === 0 ? 'Oral anticoagulation not indicated for stroke prevention.' : c.va === 1 ? 'Oral anticoagulation should be considered (ESC 2024, IIa).' : 'Oral anticoagulation recommended (ESC 2024, class I). DOAC preferred.';
      return res({ value: c.va, unit: '/ 8', cat: cat, catLabel: ['Low', 'Intermediate', '', 'High'][cat],
        lines: ['CHA₂DS₂-VASc ' + c.vasc + (p.sex ? '' : ' (sex not entered)') + ' · untreated stroke/TIA/embolism ≈ ' + RS.VASC_RATE[Math.min(c.vasc, 9)] + '%/yr (Friberg 2012)'],
        action: act, summary: 'CHA₂DS₂-VA ' + c.va + ' (CHA₂DS₂-VASc ' + c.vasc + ') · ' + act.split('(')[0].trim() });
    },
    source: 'Van Gelder et al., 2024 ESC AF guidelines; Friberg et al., Eur Heart J 2012.',
    status: 'ported'
  });

  add({
    id: 'hasbled', name: 'HAS-BLED', domain: 'Atrial fibrillation', scen: ['af'],
    blurb: 'Bleeding risk on anticoagulation; flags modifiable factors.',
    inputs: ['age', 'sbp', 'cr', 'cevd', 'priorBleed', 'antiplatelet', 'nsaid'], local: ['hUnc', 'renalDis', 'liverDis', 'labile', 'bleedDrugs', 'alcohol'],
    calc: function (p) {
      var m = need(p, ['age']);
      if (m.length) return res({ missing: m });
      var s = RS.hasbled({ hUncontrolled: p.hUnc, renal: p.renalDis, liver: p.liverDis, stroke: p.cevd, bleed: p.priorBleed, labile: p.labile, age: p.age, drugs: p.bleedDrugs, alcohol: p.alcohol });
      var mod = [];
      if (p.hUnc) mod.push('blood pressure'); if (p.labile) mod.push('INR control'); if (p.bleedDrugs) mod.push('antiplatelet/NSAID'); if (p.alcohol) mod.push('alcohol');
      return res({ value: s, unit: '/ 9', cat: s >= 3 ? 2 : 0, catLabel: s >= 3 ? 'High' : 'Low–moderate',
        lines: ['Major bleeds ≈ ' + (s > 5 ? '≥ 12.5' : RS.HASBLED_RATE[s]) + ' per 100 patient-years (Pisters 2010).'],
        action: (mod.length ? 'Correct modifiable factors: ' + mod.join(', ') + '. ' : '') + 'A high score calls for closer follow-up; it is not a reason to withhold anticoagulation.',
        summary: 'HAS-BLED ' + s + (s >= 3 ? ' (high bleeding risk)' : '') });
    },
    source: 'Pisters et al., Chest 2010; 2024 ESC AF guidelines.',
    status: 'ported'
  });

  add({
    id: 'doac', name: 'DOAC dose check', domain: 'Atrial fibrillation', scen: ['af'],
    blurb: 'Apixaban or rivaroxaban dose for AF or VTE treatment, from age, weight and Cockcroft-Gault CrCl.',
    inputs: ['age', 'sex', 'wt', 'cr', 'antiplatelet', 'nsaid'], local: ['indication', 'drug', 'liverCP', 'inhibitor', 'inducer'],
    calc: function (p) {
      var r = UT.doac({ indication: p.indication, drug: p.drug, age: p.age, sex: p.sex, wt: p.wt, cr: p.cr, liver: p.liverCP, inhibitor: p.inhibitor, inducer: p.inducer, bleedDrugs: p.antiplatelet || p.nsaid });
      if (r.missing.length) return res({ missing: r.missing });
      var name = p.drug === 'rivaroxaban' ? 'Rivaroxaban' : 'Apixaban';
      return res({ value: r.dose, text: true, cat: r.cat, catLabel: r.cat === 0 ? 'Full dose' : r.cat === 1 ? 'Full dose, caution' : r.cat === 2 ? 'Reduced dose' : 'Avoid',
        lines: ['CrCl ' + f0(r.crcl) + ' mL/min (Cockcroft-Gault, actual weight)'].concat(r.reasons), warn: r.warn,
        action: (p.indication === 'vte' ? 'VTE treatment dosing (EU label). Not for active cancer-associated VTE without specialist review, or antiphospholipid syndrome.' : 'Non-valvular AF dosing (EU label). Not for mechanical valves or moderate–severe mitral stenosis.') + ' Edoxaban and dabigatran are not included (not available in Egypt).',
        summary: name + ' ' + r.dose + (p.indication === 'vte' ? ' for VTE' : ' for AF') + ' (CrCl ' + f0(r.crcl) + ')' });
    },
    source: 'Apixaban (Eliquis) and rivaroxaban (Xarelto) EU SmPC; 2021 EHRA practical guide on NOACs; 2019 ESC pulmonary embolism guidelines.',
    status: 'new'
  });

  /* ===== ACS ===== */
  add({
    id: 'grace', name: 'GRACE in-hospital', domain: 'ACS', scen: ['acs'],
    blurb: 'In-hospital death in ACS (Granger 2003 points model).',
    inputs: ['age', 'hr', 'sbp', 'cr', 'killip', 'arrest', 'stdev', 'enz'],
    calc: function (p) {
      var m = need(p, ['age', 'hr', 'sbp', 'cr']);
      if (m.length) return res({ missing: m });
      var g = RS.grace({ age: p.age, hr: p.hr, sbp: p.sbp, cr: p.cr, killip: +p.killip, arrest: p.arrest, stdev: p.stdev, enz: p.enz }), b = g.parts;
      var cat = [0, 1, 3][g.cat];
      return res({ value: g.total, unit: 'pts', cat: cat, catLabel: ['Low', 'Intermediate', 'High'][g.cat],
        lines: ['In-hospital mortality ≈ ' + f1(g.prob) + '%', 'Age ' + b.age + ' · HR ' + b.hr + ' · SBP ' + b.sbp + ' · Cr ' + b.cr + ' · Killip ' + b.killip + ' · arrest ' + b.arrest + ' · ST ' + b.st + ' · troponin ' + b.enz,
          'GRACE 1.0 points model; the GRACE 2.0 equations are not openly published.'],
        action: g.total > 140 ? 'GRACE > 140: early invasive strategy within 24 h (ESC 2023).' : 'Bands: ≤ 108 low · 109–140 intermediate · > 140 high.',
        summary: 'GRACE ' + g.total + ' (' + ['low', 'intermediate', 'high'][g.cat] + ', in-hospital death ' + f1(g.prob) + '%)' });
    },
    source: 'Granger et al., Arch Intern Med 2003; 2023 ESC ACS guidelines.',
    status: 'ported'
  });

  add({
    id: 'timiua', name: 'TIMI UA/NSTEMI', domain: 'ACS', scen: ['acs'],
    blurb: '14-day death, MI or urgent revascularisation.',
    inputs: ['age', 'famhx', 'htn', 'lipid', 'dm', 'smoker', 'stdev', 'enz'], local: ['knownCAD', 'asa', 'angina2'],
    calc: function (p) {
      var m = need(p, ['age']);
      if (m.length) return res({ missing: m });
      var t = RS.timiUA({ age: p.age, fhx: p.famhx, htn: p.htn, lipid: p.lipid, dm: p.dm, smoker: p.smoker, knownCAD: p.knownCAD, asa: p.asa, angina2: p.angina2, stdev: p.stdev, enz: p.enz });
      var c = t.score <= 2 ? 0 : t.score <= 4 ? 1 : 3;
      return res({ value: t.score, unit: '/ 7', cat: c, catLabel: ['Low', 'Intermediate', '', 'High'][c],
        lines: ['14-day event rate ' + t.rate + '% (Antman 2000)', 'Risk factors counted: ' + t.rf + ' of 5 (≥ 3 scores 1)'],
        summary: 'TIMI UA/NSTEMI ' + t.score + '/7 (' + t.rate + '% at 14 days)' });
    },
    source: 'Antman et al., JAMA 2000.',
    status: 'ported'
  });

  add({
    id: 'timistemi', name: 'TIMI STEMI', domain: 'ACS', scen: ['acs'],
    blurb: '30-day mortality in STEMI.',
    inputs: ['age', 'sbp', 'hr', 'killip', 'wt', 'dm', 'htn'], local: ['anginaHx', 'antLBBB', 'late'],
    calc: function (p) {
      var m = need(p, ['age', 'sbp', 'hr']);
      if (m.length) return res({ missing: m });
      var t = RS.timiSTEMI({ age: p.age, dm: p.dm, htn: p.htn, anginaHx: p.anginaHx, sbp: p.sbp, hr: p.hr, killip: +p.killip, weight: p.wt, antLBBB: p.antLBBB, late: p.late });
      var c = t.score <= 3 ? 0 : t.score <= 6 ? 1 : 3;
      return res({ value: t.score, unit: '/ 14', cat: c, catLabel: ['Low', 'Intermediate', '', 'High'][c],
        lines: ['30-day mortality ' + t.rate + '% (Morrow 2000)'], warn: p.wt == null ? ['Weight not entered (< 67 kg scores 1).'] : [],
        summary: 'TIMI STEMI ' + t.score + '/14 (' + t.rate + '% 30-day mortality)' });
    },
    source: 'Morrow et al., Circulation 2000.',
    status: 'ported'
  });

  /* ----- Phase 2: ACS ----- */
  add({
    id: 'heart', name: 'HEART', domain: 'ACS', scen: ['acs'],
    blurb: '6-week MACE risk in chest pain. Age and risk factors come from the profile.',
    inputs: ['age', 'htn', 'lipid', 'dm', 'smoker', 'famhx', 'wt', 'ht', 'cad', 'cevd', 'pad'], local: ['heartHx', 'heartEcg', 'heartTn'],
    calc: function (p, d) {
      var m = need(p, ['age', 'heartHx', 'heartEcg', 'heartTn']);
      if (m.length) return res({ missing: m });
      var n = (p.htn ? 1 : 0) + (p.lipid ? 1 : 0) + (p.dm ? 1 : 0) + (p.smoker ? 1 : 0) + (p.famhx ? 1 : 0) + (d.bmi > 30 ? 1 : 0);
      var athero = !!(p.cad || p.cevd || p.pad);
      var rf = athero || n >= 3 ? 2 : n >= 1 ? 1 : 0, ag = p.age >= 65 ? 2 : p.age >= 45 ? 1 : 0;
      var s = +p.heartHx + +p.heartEcg + ag + rf + +p.heartTn, c = s <= 3 ? 0 : s <= 6 ? 1 : 3;
      return res({ value: s, unit: '/ 10', cat: c, catLabel: ['Low', 'Moderate', '', 'High'][c],
        lines: ['6-week MACE ' + ['0.9–1.7%', '12–16.6%', '', '50–65%'][c],
          'History ' + p.heartHx + ' · ECG ' + p.heartEcg + ' · age ' + ag + ' · risk factors ' + rf + ' (' + (athero ? 'known atherosclerotic disease' : n + ' counted') + ') · troponin ' + p.heartTn],
        action: c === 0 ? 'Low risk: early discharge can be considered.' : c === 1 ? 'Moderate risk: admit for observation and further testing.' : 'High risk: early invasive strategy.',
        summary: 'HEART ' + s + '/10 (' + ['low', 'moderate', '', 'high'][c] + ' risk)' });
    },
    source: 'Six et al., Neth Heart J 2008; Backus et al., Int J Cardiol 2013. Risk factors: hypertension, hypercholesterolaemia, diabetes, obesity (BMI > 30), smoking, family history.',
    status: 'new'
  });

  add({
    id: 'crusade', name: 'CRUSADE', domain: 'ACS', scen: ['acs', 'pci'],
    blurb: 'In-hospital major bleeding risk in NSTEMI.',
    inputs: ['hct', 'hb', 'cr', 'age', 'sex', 'wt', 'hr', 'sbp', 'dm', 'killip', 'pad', 'cevd'], local: ['chfSigns', 'priorVasc'],
    calc: function (p, d) {
      var m = need(p, ['sex', 'hr', 'sbp']);
      if (d.hct == null) m.push('hct');
      if (d.crcl == null) ['cr', 'age', 'wt'].forEach(function (k) { if (p[k] == null) m.push(k); });
      if (m.length) return res({ missing: m });
      var r = UT.crusade({ hct: d.hct, crcl: d.crcl, hr: p.hr, sex: p.sex, chf: p.chfSigns, vasc: p.priorVasc, dm: p.dm, sbp: p.sbp }), b = r.parts;
      return res({ value: r.score, unit: '/ 100', cat: [0, 0, 1, 2, 3][r.grade], catLabel: r.label,
        lines: ['In-hospital major bleeding ≈ ' + r.rate + '%', 'Hct ' + b.hct + ' · CrCl ' + b.crcl + ' · HR ' + b.hr + ' · sex ' + b.sex + ' · HF signs ' + b.chf + ' · vascular ' + b.vasc + ' · diabetes ' + b.dm + ' · SBP ' + b.sbp],
        warn: d.hctEst ? ['Haematocrit estimated as 3 × haemoglobin (' + f1(d.hct) + '%).'] : [],
        summary: 'CRUSADE ' + r.score + ' (' + r.label.toLowerCase() + ' bleeding risk, ' + r.rate + '%)' });
    },
    source: 'Subherwal et al., Circulation 2009.',
    status: 'verified', verifiedBy: 'MDCalc CRUSADE (13 patients covering every band)', checked: '2026-11-09'
  });

  add({
    id: 'tn01', name: 'ESC 0/1-h troponin', domain: 'ACS', scen: ['acs'],
    blurb: 'Rule-out, observe or rule-in NSTEMI with assay-specific hs-troponin cut-offs.',
    inputs: [], local: ['tnAssay', 'tn0', 'tn1', 'onset3h'],
    calc: function (p) {
      if (p.tn0 == null) return res({ missing: ['tn0'] });
      var r = UT.tn01({ assay: p.tnAssay, t0: p.tn0, t1: p.tn1, onset3h: p.onset3h }), c = r.cut;
      var cuts = 'Cut-offs (ng/L): very low < ' + c[0] + ' · low < ' + c[1] + ' · no 1-h Δ < ' + c[2] + ' · high ≥ ' + c[3] + ' · 1-h Δ ≥ ' + c[4];
      if (!r.out) return res({ missing: ['tn1'], hint: r.why });
      var L = { out: ['Rule-out', 0, 'NSTEMI very unlikely. Consider discharge and outpatient work-up if the clinical picture and ECG agree.'],
        observe: ['Observe', 1, 'Repeat troponin at 3 h and do echocardiography; decide on further testing by clinical picture.'],
        'in': ['Rule-in', 3, 'NSTEMI likely: admit and plan invasive coronary angiography.'] }[r.out];
      return res({ value: L[0], text: true, cat: L[1], catLabel: r.assay.split(' (')[0], lines: [r.why, cuts], action: L[2],
        warn: ['Use only with the ECG and full clinical assessment. Cut-offs apply regardless of age, sex and renal function.'],
        summary: 'ESC 0/1-h troponin: ' + L[0].toLowerCase() + ' (' + p.tn0 + (p.tn1 != null ? ' → ' + p.tn1 : '') + ' ng/L, ' + r.assay.split(' (')[0] + ')' });
    },
    source: 'Collet et al., 2020 ESC NSTE-ACS guidelines (supplementary table of assay cut-offs); Byrne et al., 2023 ESC ACS guidelines.',
    status: 'new'
  });

  /* ===== Pre-operative ===== */
  add({
    id: 'rcri', name: 'RCRI', domain: 'Pre-operative', scen: ['preop'],
    blurb: 'Revised Cardiac Risk Index for non-cardiac surgery.',
    inputs: ['hf', 'cevd', 'dm', 'insulin', 'cr'], local: ['highRiskSurg', 'ihd'],
    calc: function (p) {
      var r = RS.rcri({ highRiskSurg: p.highRiskSurg, ihd: p.ihd, chf: p.hf, cvd: p.cevd, insulin: p.dm && p.insulin, cr: p.cr });
      var s = r.score, c = Math.min(s, 3);
      return res({ value: s, unit: '/ 6', cat: c, catLabel: 'Class ' + ['I', 'II', 'III', 'IV'][c],
        lines: ['Major cardiac complications ' + r.lee + '% (Lee 1999)', '30-day death, MI or arrest ' + r.ccs + '% (Duceppe 2017)'],
        warn: p.cr == null ? ['Creatinine not entered (> 2 mg/dL scores 1).'] : [],
        action: s >= 1 ? 'RCRI ≥ 1: consider BNP/NT-proBNP and troponin before intermediate- or high-risk surgery (ESC 2022).' : 'RCRI 0: low clinical risk.',
        summary: 'RCRI ' + s + ' (class ' + ['I', 'II', 'III', 'IV'][c] + ', MACE ' + r.ccs + '%)' });
    },
    source: 'Lee et al., Circulation 1999; Duceppe et al., Can J Cardiol 2017; 2022 ESC non-cardiac surgery guidelines.',
    status: 'ported'
  });

  add({
    id: 'esccat', name: 'ESC surgical risk category', domain: 'Pre-operative', scen: ['preop'],
    blurb: 'Surgery-specific 30-day risk of CV death, MI or stroke (ESC 2022, Table 4).',
    inputs: [], local: ['surgProc', 'urgency'],
    calc: function (p) {
      var c = surgCat(p.surgProc);
      if (!c) return res({ missing: ['surgProc'] });
      var L = { L: ['Low', '< 1%', 0], I: ['Intermediate', '1–5%', 1], H: ['High', '> 5%', 3] }[c];
      return res({ value: L[0], text: true, cat: L[2], catLabel: L[1] + ' 30-day risk', lines: [procName(p.surgProc)],
        summary: 'ESC surgical risk: ' + L[0].toLowerCase() + ' (' + procName(p.surgProc).toLowerCase() + ')' });
    },
    source: 'Halvorsen et al., 2022 ESC Guidelines on cardiovascular assessment and management of patients undergoing non-cardiac surgery, Table 4.',
    status: 'new'
  });

  add({
    id: 'dasi', name: 'DASI', domain: 'Pre-operative', scen: ['preop'],
    blurb: 'Duke Activity Status Index: functional capacity from 12 activities the patient can do.',
    inputs: [], local: ['dasi1', 'dasi2', 'dasi3', 'dasi4', 'dasi5', 'dasi6', 'dasi7', 'dasi8', 'dasi9', 'dasi10', 'dasi11', 'dasi12'],
    calc: function (p, d, s) {
      var x = dasiOf(s);
      if (!x.done) return res({ hint: 'Tick each activity the patient can do without difficulty.' });
      var cat = x.mets < 4 ? 3 : x.score <= 34 ? 1 : 0;
      return res({ value: x.score, unit: '/ 58.2', cat: cat, catLabel: x.mets < 4 ? 'Poor (< 4 METs)' : x.score <= 34 ? 'Reduced' : 'Good',
        lines: ['Estimated ' + x.mets.toFixed(1) + ' METs · peak VO₂ ' + x.vo2.toFixed(1) + ' mL/kg/min'],
        action: x.mets < 4 ? 'Poor functional capacity: see the ESC pre-op pathway for further testing.' : x.score <= 34 ? 'DASI ≤ 34 was linked to more 30-day death or MI in the METS study.' : 'Functional capacity adequate.',
        summary: 'DASI ' + x.score.toFixed(1) + ' (≈ ' + x.mets.toFixed(1) + ' METs)' });
    },
    source: 'Hlatky et al., Am J Cardiol 1989; Wijeysundera et al., Lancet 2018 (METS study).',
    status: 'new'
  });

  var GUPTA = { anorectal: -0.16, aortic: 1.60, bariatric: -0.25, brain: 1.40, breast: -1.61, cardiac: 1.01, ent: 0.71, foregut: 1.39, gallbladder: 0.59, hernia: 0,
    intestinal: 1.14, neck: 0.18, obgyn: 0.76, ortho: 0.80, otherabd: 1.13, pv: 0.86, skin: 0.54, spine: 0.21, thoracic: 0.40, vein: -1.09, urology: -0.26 };
  add({
    id: 'gupta', name: 'Gupta MICA', domain: 'Pre-operative', scen: ['preop'],
    blurb: 'Risk of peri-operative MI or cardiac arrest within 30 days (NSQIP).',
    inputs: ['age', 'cr'], local: ['guptaProc', 'asaClass', 'guptaFS'],
    calc: function (p) {
      var m = need(p, ['age']); if (!p.guptaProc) m.push('guptaProc');
      if (m.length) return res({ missing: m });
      var x = -5.25 + 0.02 * p.age + { indep: 0, partial: 0.65, total: 1.03 }[p.guptaFS] + { 1: -5.17, 2: -3.29, 3: -1.92, 4: -0.95, 5: 0 }[p.asaClass] +
        (p.cr == null ? -0.10 : p.cr > 1.5 ? 0.61 : 0) + GUPTA[p.guptaProc];
      var v = 100 * Math.exp(x) / (1 + Math.exp(x));
      return res({ value: v, unit: '%', dp: 2, cat: v < 1 ? 0 : v < 2 ? 1 : v < 5 ? 2 : 3, catLabel: v < 1 ? 'Low (< 1%)' : 'Elevated (≥ 1%)',
        warn: p.cr == null ? ['Creatinine not entered: scored as unknown.'] : [],
        action: v >= 1 ? 'Risk ≥ 1%: elevated peri-operative cardiac risk.' : 'Risk < 1%: low peri-operative cardiac risk.',
        summary: 'Gupta MICA ' + v.toFixed(2) + '%' });
    },
    source: 'Gupta et al., Circulation 2011; coefficients as published on MDCalc.',
    status: 'verified', verifiedBy: 'the coefficients in the published model (MDCalc formula, checked 7 Nov 2026)'
  });

  add({
    id: 'escpath', name: 'ESC 2022 pre-op pathway', domain: 'Pre-operative', scen: ['preop'],
    blurb: 'Suggested pre-operative work-up from timing, surgical risk, patient risk, functional capacity and RCRI.',
    inputs: ['age', 'htn', 'dm', 'smoker', 'lipid', 'famhx', 'cad', 'cevd', 'pad', 'hf'], local: ['urgency', 'surgProc', 'valve', 'cvSymptoms', 'poorFC', 'bnpHigh'],
    calc: function (p, d, s) {
      var c = surgCat(p.surgProc);
      if (!c) return res({ missing: ['surgProc'] });
      if (p.age == null) return res({ missing: ['age'] });
      var cvd = !!(p.cad || p.cevd || p.pad || p.hf || p.valve), rf = p.age >= 65 || !!(p.htn || p.dm || p.smoker || p.lipid || p.famhx);
      var rcri = RS.rcri({ highRiskSurg: p.highRiskSurg, ihd: p.ihd, chf: p.hf, cvd: p.cevd, insulin: p.dm && p.insulin, cr: p.cr }).score;
      var group = cvd ? 'Known CVD' : rf ? 'Age ≥ 65 or CV risk factors' : 'Age < 65, no CVD or risk factors';
      var L = [], W = [];
      if (p.urgency === 'urgent') {
        L.push('Urgent or emergency surgery: do not delay for cardiac testing.');
        if (cvd || rf) L.push('hs-troponin before (if possible) and at 24 h and 48 h after surgery (I).');
        L.push('Continue indicated cardiac medicines; manage peri-operatively.');
      } else if (!cvd && !rf) {
        if (c === 'L') L.push('Low-risk surgery: no further cardiac testing. Proceed.');
        else L.push('ECG and biomarkers may be considered (IIb). Proceed if no new findings.');
      } else if (c === 'L') {
        L.push('Low-risk surgery: proceed; routine ECG and biomarkers are not needed' + (cvd ? ' (ECG may be considered in known CVD)' : '') + '.');
      } else {
        L.push('12-lead ECG before surgery.');
        L.push('hs-troponin before surgery and at 24 h and 48 h after (I).');
        L.push('NT-proBNP or BNP before surgery should be considered (IIa).');
        if (c === 'H' && (p.poorFC || p.bnpHigh)) L.push('Transthoracic echo before high-risk surgery: poor functional capacity and/or raised NP (I).');
        if (c === 'H' && p.poorFC && (p.cad || rcri >= 2)) L.push('Stress imaging before elective high-risk surgery: poor functional capacity with CAD or high clinical risk (RCRI ' + rcri + ') (I).');
        if (p.urgency === 'timesens') W.push('Time-sensitive surgery: do only tests that would change management or timing.');
      }
      if (p.cvSymptoms) L.push('Symptoms or signs suggesting CVD: assess as for a non-surgical patient; TTE if murmur or unexplained dyspnoea' + (p.urgency === 'urgent' ? ' (do not delay urgent surgery)' : '') + '.');
      if (!p.poorFC && c === 'H' && !dasiOf(s).done && p.urgency !== 'urgent' && (cvd || rf)) W.push('Functional capacity not assessed: complete DASI or ask about climbing 2 flights of stairs.');
      var cat = p.urgency === 'urgent' ? 2 : (!cvd && !rf) || c === 'L' ? 0 : c === 'H' ? 2 : 1;
      return res({ value: group, text: true, cat: cat, catLabel: { L: 'Low-risk', I: 'Intermediate-risk', H: 'High-risk' }[c] + ' surgery', lines: L, warn: W,
        action: 'Simplified from the ESC 2022 flowcharts; clinical judgement decides. Class of recommendation in brackets.',
        summary: 'ESC pre-op (' + group.toLowerCase() + ', ' + { L: 'low', I: 'intermediate', H: 'high' }[c] + '-risk surgery): ' + L.join(' ') });
    },
    source: 'Halvorsen et al., 2022 ESC Guidelines on non-cardiac surgery, Figures 4–6 and recommendation tables.',
    status: 'new', review: 1
  });

  /* ----- Phase 2: intervention and cardiac surgery ----- */
  add({
    id: 'precise', name: 'PRECISE-DAPT', domain: 'Intervention and surgery', scen: ['pci', 'acs'],
    blurb: 'Out-of-hospital bleeding risk on DAPT after PCI; guides DAPT duration.',
    inputs: ['age', 'hb', 'wbc', 'cr', 'sex', 'wt', 'priorBleed'], local: ['pdBleed'],
    calc: function (p, d) {
      var m = need(p, ['age', 'hb', 'wbc']);
      if (d.crcl == null) ['cr', 'sex', 'wt'].forEach(function (k) { if (p[k] == null) m.push(k); });
      if (m.length) return res({ missing: m });
      var r = UT.precise({ age: p.age, hb: p.hb, wbc: p.wbc, crcl: d.crcl, bleed: p.pdBleed });
      return res({ value: r.score, unit: 'points', cat: r.grade, catLabel: r.label,
        lines: ['CrCl ' + f0(d.crcl) + ' mL/min (Cockcroft-Gault)', 'Bands: ≤ 10 very low · 11–17 low · 18–24 moderate · ≥ 25 high'],
        action: r.score >= 25 ? 'Score ≥ 25: high bleeding risk. Short DAPT (3–6 months) should be considered (ESC).' : 'Score < 25: standard or long DAPT (12–24 months) can be considered (ESC).',
        summary: 'PRECISE-DAPT ' + r.score + ' (' + r.label.toLowerCase() + ' bleeding risk)' });
    },
    source: 'Costa et al., Lancet 2017. The model is not published as a formula; the app reproduces the MDCalc calculator.',
    status: 'verified', verifiedBy: 'MDCalc PRECISE-DAPT (each input probed across its range, plus mixed patients)', checked: '2026-11-09'
  });

  add({
    id: 'archbr', name: 'ARC-HBR', domain: 'Intervention and surgery', scen: ['pci'],
    blurb: 'High bleeding risk at PCI: 1 major or 2 minor criteria. Lab and age criteria come from the profile.',
    inputs: ['age', 'sex', 'cr', 'hb', 'plt', 'anticoag', 'nsaid'],
    local: ['arcOAC', 'arcBleedMaj', 'arcDiath', 'arcCirr', 'arcCancer', 'arcICH', 'arcStrokeMaj', 'arcSurg', 'arcBleedMin', 'arcNsaid', 'arcStrokeMin'],
    calc: function (p, d) {
      var maj = [], min = [], unk = [];
      if (p.arcOAC) maj.push('long-term OAC');
      if (d.egfr != null) { if (d.egfr < 30) maj.push('eGFR < 30'); else if (d.egfr < 60) min.push('eGFR 30–59'); } else unk.push('eGFR');
      if (p.hb != null) { if (p.hb < 11) maj.push('Hb < 11 g/dL'); else if (p.hb < (p.sex === 'female' ? 12 : 13)) min.push('Hb ' + (p.sex === 'female' ? '11–11.9' : '11–12.9') + ' g/dL'); } else unk.push('haemoglobin');
      if (p.plt != null) { if (p.plt < 100) maj.push('platelets < 100'); } else unk.push('platelets');
      if (p.age != null) { if (p.age >= 75) min.push('age ≥ 75'); } else unk.push('age');
      [['arcBleedMaj', 'recent or recurrent bleeding'], ['arcDiath', 'bleeding diathesis'], ['arcCirr', 'cirrhosis with portal hypertension'], ['arcCancer', 'active malignancy'],
        ['arcICH', 'ICH or brain AVM'], ['arcStrokeMaj', 'recent moderate–severe stroke'], ['arcSurg', 'major surgery or trauma']].forEach(function (x) { if (p[x[0]]) maj.push(x[1]); });
      [['arcBleedMin', 'bleeding 6–12 months ago'], ['arcNsaid', 'NSAIDs or steroids'], ['arcStrokeMin', 'prior ischaemic stroke']].forEach(function (x) { if (p[x[0]]) min.push(x[1]); });
      var hbr = maj.length >= 1 || min.length >= 2;
      return res({ value: hbr ? 'High bleeding risk' : 'Not HBR', text: true, cat: hbr ? 3 : 0, catLabel: maj.length + ' major · ' + min.length + ' minor',
        lines: [maj.length ? 'Major: ' + maj.join(', ') : 'No major criteria', min.length ? 'Minor: ' + min.join(', ') : 'No minor criteria'],
        warn: unk.length ? ['Not entered, so not assessed: ' + unk.join(', ') + '.'] : [],
        action: hbr ? 'HBR (≥ 4% BARC 3–5 bleeding or ≥ 1% ICH at 1 year): consider short DAPT and bleeding-avoidance strategies.' : 'Does not meet ARC-HBR on the criteria entered.',
        summary: 'ARC-HBR: ' + (hbr ? 'high bleeding risk' : 'not HBR') + ' (' + maj.length + ' major, ' + min.length + ' minor)' });
    },
    source: 'Urban et al., Eur Heart J / Circulation 2019 (Academic Research Consortium for High Bleeding Risk).',
    status: 'new'
  });

  add({
    id: 'mehran', name: 'Mehran contrast nephropathy', domain: 'Intervention and surgery', scen: ['pci'],
    blurb: 'Risk of contrast-induced nephropathy and dialysis after PCI.',
    inputs: ['age', 'sex', 'dm', 'cr', 'hct', 'hb'], local: ['contrast', 'mHypo', 'mIABP', 'mCHF'],
    calc: function (p, d) {
      var m = need(p, ['age', 'sex', 'cr']);
      if (m.length) return res({ missing: m });
      var an = d.hct != null ? d.hct < (p.sex === 'female' ? 36 : 39) : null;
      var r = UT.mehran({ hypo: p.mHypo, iabp: p.mIABP, chf: p.mCHF, age: p.age, anaemia: !!an, dm: p.dm, contrast: p.contrast, egfr: d.egfr });
      var w = [];
      if (an == null) w.push('Haematocrit or haemoglobin not entered: anaemia (3 points) not assessed.');
      else if (d.hctEst) w.push('Anaemia judged from haematocrit estimated as 3 × haemoglobin.');
      if (p.contrast == null) w.push('Contrast volume not entered: each 100 mL adds 1 point.');
      return res({ value: r.score, unit: 'points', cat: r.grade, catLabel: r.label,
        lines: ['Contrast nephropathy ' + r.cin + '% · dialysis ' + r.dialysis + '%', 'eGFR ' + f0(d.egfr) + (an ? ' · anaemia' : '') + (p.contrast != null ? ' · contrast ' + f0(p.contrast) + ' mL' : '')],
        warn: w, action: r.grade >= 1 ? 'Hydrate, minimise contrast, hold nephrotoxic drugs and recheck creatinine at 48–72 h.' : 'Low risk; standard hydration.',
        summary: 'Mehran ' + r.score + ' (CIN risk ' + r.cin + '%, dialysis ' + r.dialysis + '%)' });
    },
    source: 'Mehran et al., J Am Coll Cardiol 2004 (eGFR version).',
    status: 'new'
  });

  add({
    id: 'contrastmax', name: 'Contrast limit', domain: 'Intervention and surgery', scen: ['pci'],
    blurb: 'Maximum contrast volume from weight and kidney function.',
    inputs: ['wt', 'cr', 'age', 'sex'], local: ['contrast'],
    calc: function (p, d) {
      var m = need(p, ['wt', 'cr']);
      if (m.length) return res({ missing: m });
      var macd = Math.min(300, 5 * p.wt / p.cr), L = ['Cigarroa limit: 5 mL × kg ÷ creatinine (mg/dL), capped at 300 mL'], w = [], cat = null;
      if (d.crcl != null) L.push('Volume-to-CrCl ratio: keep below ' + f0(2 * d.crcl) + ' mL (2 × CrCl); risk rises sharply above ' + f0(3 * d.crcl) + ' mL (3 × CrCl)');
      if (p.contrast != null) {
        cat = p.contrast > macd || (d.crcl != null && p.contrast > 3 * d.crcl) ? 3 : d.crcl != null && p.contrast > 2 * d.crcl ? 1 : 0;
        L.push('Planned or given: ' + f0(p.contrast) + ' mL' + (d.crcl != null ? ' (ratio ' + (p.contrast / d.crcl).toFixed(1) + ')' : ''));
        if (p.contrast > macd) w.push('Above the Cigarroa limit.');
      }
      return res({ value: macd, dp: 0, unit: 'mL maximum', cat: cat, catLabel: cat == null ? '' : ['Within limits', 'Above 2 × CrCl', '', 'Above limit'][cat], lines: L, warn: w,
        summary: 'Contrast limit ' + f0(macd) + ' mL' + (p.contrast != null ? ' (given ' + f0(p.contrast) + ' mL)' : '') });
    },
    source: 'Cigarroa et al., Am J Med 1989; Gurm et al., J Am Coll Cardiol 2011 (volume-to-creatinine-clearance ratio).',
    status: 'new'
  });

  add({
    id: 'euroscore2', name: 'EuroSCORE II', domain: 'Intervention and surgery', scen: ['surg'],
    blurb: 'Predicted in-hospital mortality after cardiac surgery.',
    inputs: ['age', 'sex', 'cr', 'wt', 'ef', 'dm', 'insulin', 'pad'],
    local: ['euWt', 'euUrg', 'euNyha', 'euLV', 'euPH', 'euDial', 'euIDDM', 'euArt', 'euMob', 'euPrev', 'euLung', 'euEndo', 'euCrit', 'euCCS4', 'euMI', 'euAorta'],
    calc: function (p, d) {
      var m = need(p, ['age', 'sex']);
      if (!p.euDial && d.crcl == null) ['cr', 'wt'].forEach(function (k) { if (p[k] == null) m.push(k); });
      if (m.length) return res({ missing: m });
      var v = UT.euroscore({ age: p.age, sex: p.sex, dialysis: p.euDial, crcl: d.crcl, art: p.euArt, mob: p.euMob, prev: p.euPrev, lung: p.euLung, endo: p.euEndo, crit: p.euCrit,
        iddm: p.euIDDM, nyha: p.euNyha, ccs4: p.euCCS4, lv: p.euLV, mi: p.euMI, ph: p.euPH, urg: p.euUrg, weight: p.euWt, aorta: p.euAorta });
      var c = v < 2 ? 0 : v < 5 ? 1 : v < 10 ? 2 : 3;
      return res({ value: v, unit: '%', dp: 2, cat: c, catLabel: ['Low', 'Intermediate', 'High', 'Very high'][c],
        lines: [(p.euDial ? 'On dialysis' : 'CrCl ' + f0(d.crcl) + ' mL/min') + ' · LV ' + { good: 'good', mod: 'moderate', poor: 'poor', vpoor: 'very poor' }[p.euLV] + (p.ef != null ? ' (EF ' + f0(p.ef) + '%)' : ''),
          'Bands used here: < 2% low · 2–5% intermediate · 5–10% high · > 10% very high (not part of the model)'],
        warn: p.age < 18 ? ['Model is for adults.'] : [],
        summary: 'EuroSCORE II ' + v.toFixed(2) + '%' });
    },
    source: 'Nashef et al., Eur J Cardiothorac Surg 2012.',
    status: 'verified', verifiedBy: 'MDCalc EuroSCORE II (4 patients exercising every coefficient)', checked: '2026-11-09'
  });

  /* ===== Heart failure ===== */
  add({
    id: 'h2fpef', name: 'H₂FPEF', domain: 'Heart failure', scen: ['hf'],
    blurb: 'Probability that unexplained dyspnoea with preserved EF is HFpEF.',
    inputs: ['age', 'wt', 'ht', 'eePrime', 'pasp', 'trv', 'af'], local: ['twoAntiHTN'],
    calc: function (p, d) {
      var m = need(p, ['age']);
      if (d.bmi == null) ['wt', 'ht'].forEach(function (k) { if (p[k] == null) m.push(k); });
      if (p.eePrime == null) m.push('eePrime');
      if (d.pasp == null) m.push('pasp');
      if (m.length) return res({ missing: m });
      var y = -9.1917 + 0.0451 * p.age + 0.1307 * d.bmi + 0.0859 * p.eePrime + 0.0520 * d.pasp + 1.6997 * (p.af ? 1 : 0);
      var prob = 100 * Math.exp(y) / (1 + Math.exp(y));
      var pts = (d.bmi > 30 ? 2 : 0) + (p.twoAntiHTN ? 1 : 0) + (p.af ? 3 : 0) + (d.pasp > 35 ? 1 : 0) + (p.age > 60 ? 1 : 0) + (p.eePrime > 9 ? 1 : 0);
      var c = prob < 25 ? 0 : prob < 75 ? 1 : 3;
      var L = ['Points score ' + pts + '/9: ' + (pts <= 1 ? 'HFpEF can be discounted' : pts >= 6 ? 'HFpEF can be diagnosed' : 'intermediate, consider further testing'),
        'BMI ' + f1(d.bmi) + ' · E/e′ ' + f1(p.eePrime) + ' · PASP ' + f0(d.pasp) + (p.af ? ' · AF' : '') + (p.age > 60 ? ' · age > 60' : '')];
      if (d.paspEst) L.push('PASP estimated from TR velocity ' + f1(p.trv) + ' m/s assuming RA pressure 5 mmHg.');
      return res({ value: prob, unit: '%', cat: c, catLabel: prob < 25 ? 'Low' : prob < 75 ? 'Intermediate' : 'High', lines: L,
        action: prob < 25 ? 'HFpEF unlikely: look for other causes of dyspnoea.' : prob >= 75 ? 'HFpEF likely: treat as HFpEF without further testing.' : 'Intermediate: diastolic stress echo or invasive haemodynamics if the diagnosis matters.',
        warn: p.ef != null && p.ef < 50 ? ['EF ' + f0(p.ef) + '%: the score is for preserved EF (≥ 50%).'] : [],
        summary: 'H₂FPEF ' + f0(prob) + '% probability of HFpEF (points ' + pts + '/9)' });
    },
    source: 'Reddy et al., Circulation 2018. The percentage is the published continuous model; the 0–9 points score is shown alongside it.',
    status: 'verified', verifiedBy: 'MDCalc H2FPEF (9 patients, exact)', checked: '2026-11-24'
  });

  add({
    id: 'hfapeff', name: 'HFA-PEFF', domain: 'Heart failure', scen: ['hf'],
    blurb: 'ESC/HFA step 2 score: echo and natriuretic peptide evidence for HFpEF, 0–6 points.',
    inputs: ['sex', 'af', 'eePrime', 'ePrimeSept', 'ePrimeLat', 'trv', 'pasp', 'lavi', 'lvmi', 'rwt', 'wallThick', 'gls', 'ntprobnp', 'bnp'],
    calc: function (p, d) {
      var af = !!p.af, got = function (k) { return p[k] != null; };
      var F1 = [], F2 = [], M1 = [], M2 = [], B1 = [], B2 = [], unk = [];

      if (p.ePrimeSept != null && p.ePrimeSept < 7) F1.push('e′ septal ' + f1(p.ePrimeSept));
      if (p.ePrimeLat != null && p.ePrimeLat < 10) F1.push('e′ lateral ' + f1(p.ePrimeLat));
      if (p.eePrime != null && p.eePrime >= 15) F1.push('E/e′ ' + f1(p.eePrime));
      if (d.trv != null && d.trv > 2.8) F1.push('TR velocity ' + f1(d.trv) + ' m/s');
      if (p.eePrime != null && p.eePrime >= 9 && p.eePrime < 15) F2.push('E/e′ ' + f1(p.eePrime));
      if (p.gls != null && p.gls < 16) F2.push('GLS ' + f1(p.gls) + '%');
      if (!got('ePrimeSept') && !got('ePrimeLat') && !got('eePrime') && !got('gls') && d.trv == null) unk.push('functional');

      var laviMaj = af ? 40 : 34, laviMin = af ? 34 : 29, lvmiMaj = p.sex === 'female' ? 122 : 149, lvmiMin = p.sex === 'female' ? 95 : 115;
      if (p.lavi != null && p.lavi > laviMaj) M1.push('LAVI ' + f1(p.lavi) + ' mL/m²');
      if (p.lvmi != null && p.rwt != null && p.lvmi >= lvmiMaj && p.rwt > 0.42) M1.push('LV mass index ' + f0(p.lvmi) + ' with RWT ' + p.rwt.toFixed(2));
      if (p.lavi != null && p.lavi > laviMin && p.lavi <= laviMaj) M2.push('LAVI ' + f1(p.lavi) + ' mL/m²');
      if (p.lvmi != null && p.lvmi > lvmiMin) M2.push('LV mass index ' + f0(p.lvmi));
      if (p.rwt != null && p.rwt > 0.42) M2.push('RWT ' + p.rwt.toFixed(2));
      if (p.wallThick != null && p.wallThick >= 12) M2.push('wall thickness ' + f1(p.wallThick) + ' mm');
      if (!got('lavi') && !got('lvmi') && !got('rwt') && !got('wallThick')) unk.push('morphological');

      var np = af ? { nMaj: 660, nMin: 365, bMaj: 240, bMin: 105 } : { nMaj: 220, nMin: 125, bMaj: 80, bMin: 35 };
      if (p.ntprobnp != null && p.ntprobnp > np.nMaj) B1.push('NT-proBNP ' + f0(p.ntprobnp));
      if (p.bnp != null && p.bnp > np.bMaj) B1.push('BNP ' + f0(p.bnp));
      if (p.ntprobnp != null && p.ntprobnp >= np.nMin && p.ntprobnp <= np.nMaj) B2.push('NT-proBNP ' + f0(p.ntprobnp));
      if (p.bnp != null && p.bnp >= np.bMin && p.bnp <= np.bMaj) B2.push('BNP ' + f0(p.bnp));
      if (!got('ntprobnp') && !got('bnp')) unk.push('biomarker');

      if (unk.length === 3) return res({ missing: ['eePrime', 'lavi', 'ntprobnp'], hint: 'Enter echo measurements and a natriuretic peptide.' });
      var fD = F1.length ? 2 : F2.length ? 1 : 0, mD = M1.length ? 2 : M2.length ? 1 : 0, bD = B1.length ? 2 : B2.length ? 1 : 0;
      var s = fD + mD + bD, c = s >= 5 ? 3 : s >= 2 ? 1 : 0;
      var dom = function (n, v, maj, min) { return n + ' ' + v + (v ? ' (' + (v === 2 ? maj : min).join(', ') + ')' : ''); };
      return res({ value: s, unit: '/ 6', cat: c, catLabel: s >= 5 ? 'HFpEF diagnosed' : s >= 2 ? 'Intermediate' : 'Unlikely',
        lines: [dom('Functional', fD, F1, F2), dom('Morphological', mD, M1, M2), dom('Biomarker', bD, B1, B2) + (af ? ' · AF thresholds used' : '')],
        warn: unk.length ? ['Nothing entered for the ' + unk.join(' or ') + ' domain, so it scores 0 and the total is a minimum.'] : [],
        action: s >= 5 ? 'Score ≥ 5: HFpEF confirmed; go on to step 3 (aetiology).' : s <= 1 ? 'Score ≤ 1: HFpEF very unlikely; look for other causes.' : 'Score 2–4: diastolic stress echo, or invasive haemodynamics, to settle the diagnosis.',
        summary: 'HFA-PEFF ' + s + '/6 (' + (s >= 5 ? 'HFpEF diagnosed' : s >= 2 ? 'intermediate, needs stress testing' : 'HFpEF unlikely') + ')' });
    },
    source: 'Pieske et al., Eur Heart J 2019 (HFA-PEFF step 2). Each domain scores 2 for a major criterion or 1 for a minor one.',
    status: 'new', review: 1
  });

  /* ===== Arrhythmia and ECG ===== */
  add({
    id: 'qtc', name: 'QTc', domain: 'Arrhythmia and ECG', scen: ['prev', 'af', 'acs', 'hf'],
    blurb: 'Corrected QT by Bazett, Fridericia, Framingham and Hodges.',
    inputs: ['hr', 'sex'], local: ['qt'],
    calc: function (p) {
      var m = need(p, ['qt', 'hr']);
      if (m.length) return res({ missing: m });
      var rr = 60 / p.hr, b = p.qt / Math.sqrt(rr), fr = p.qt / Math.pow(rr, 1 / 3), fm = p.qt + 154 * (1 - rr), ho = p.qt + 1.75 * (p.hr - 60);
      var lim = p.sex === 'female' ? 460 : 450, c = b > 500 ? 3 : b > lim ? 2 : b < 340 ? 1 : 0;
      var L = ['Fridericia ' + f0(fr) + ' · Framingham ' + f0(fm) + ' · Hodges ' + f0(ho) + ' ms', 'QT ' + f0(p.qt) + ' ms at ' + f0(p.hr) + ' bpm (RR ' + rr.toFixed(2) + ' s)'];
      if (Math.abs(b - fr) > 20) L.push('At this heart rate Bazett and Fridericia differ by ' + f0(Math.abs(b - fr)) + ' ms; away from 60 bpm Fridericia is the more reliable of the two.');
      if (!p.sex) L.push('Sex not entered: the 450 ms threshold for men is used.');
      return res({ value: b, dp: 0, unit: 'ms (Bazett)', cat: c,
        catLabel: c === 3 ? 'Markedly prolonged' : c === 2 ? 'Prolonged' : c === 1 ? 'Short' : 'Normal', lines: L,
        action: c === 3 ? 'QTc > 500 ms: real risk of torsades. Review QT-prolonging drugs, and correct potassium and magnesium.' :
          c === 2 ? 'Above ' + lim + ' ms for ' + (p.sex === 'female' ? 'women' : 'men') + ': review QT-prolonging drugs and electrolytes.' :
            c === 1 ? 'QTc < 340 ms: consider short QT syndrome if there are symptoms or a family history.' : 'Within normal limits.',
        summary: 'QTc ' + f0(b) + ' ms Bazett, ' + f0(fr) + ' ms Fridericia' + (c >= 2 ? ' (prolonged)' : '') });
    },
    source: 'Bazett 1920; Fridericia 1920; Sagie et al. (Framingham), Am J Cardiol 1992; Hodges 1983. Thresholds from the 2022 ESC ventricular arrhythmia guidelines.',
    status: 'new'
  });

  add({
    id: 'maggic', name: 'MAGGIC', domain: 'Heart failure', scen: ['hf'],
    blurb: '1- and 3-year mortality in chronic heart failure, from 13 variables.',
    inputs: ['age', 'sex', 'ef', 'sbp', 'wt', 'ht', 'cr', 'nyha', 'dm', 'copd', 'smoker', 'bblocker', 'acei'], local: ['hf18'],
    calc: function (p, d) {
      var m = need(p, ['age', 'sex', 'ef', 'sbp', 'cr', 'nyha']);
      if (d.bmi == null) ['wt', 'ht'].forEach(function (k) { if (p[k] == null) m.push(k); });
      if (m.length) return res({ missing: m });
      var r = UT.maggic({ ef: p.ef, age: p.age, sbp: p.sbp, bmi: d.bmi, cr: p.cr * 88.4, nyha: +p.nyha, male: p.sex === 'male',
        smoker: p.smoker, dm: p.dm, copd: p.copd, hf18: p.hf18, noBB: !p.bblocker, noACE: !p.acei }), b = r.parts;
      var c = r.y1 < 5 ? 0 : r.y1 < 15 ? 1 : r.y1 < 30 ? 2 : 3;
      return res({ value: r.score, unit: 'points', cat: c, catLabel: CAT4[c] + ' risk',
        lines: ['1-year mortality ' + r.y1 + '% · 3-year ' + r.y3 + '%',
          'EF ' + b.ef + ' · age ' + b.age + ' · SBP ' + b.sbp + ' · BMI ' + b.bmi + ' · creatinine ' + b.cr + ' · NYHA ' + b.nyha + ' · other ' + b.other],
        warn: (r.capped ? ['Score above 50 is reported at the table maximum.'] : []).concat(!p.bblocker || !p.acei ? ['Scored as not on ' + [!p.bblocker ? 'a beta blocker' : '', !p.acei ? 'an ACE inhibitor or ARB' : ''].filter(Boolean).join(' or ') + '; tick them in the profile if prescribed.'] : []),
        action: 'Derived in chronic heart failure across the EF range; use for prognosis, not for treatment choices.',
        summary: 'MAGGIC ' + r.score + ' (1-yr mortality ' + r.y1 + '%, 3-yr ' + r.y3 + '%)' });
    },
    source: 'Pocock et al., Eur Heart J 2013. Creatinine converted to µmol/L internally.',
    status: 'verified', verifiedBy: 'MDCalc MAGGIC (51 patients covering every score from 0 to 50, points and both mortalities exact)', checked: '2026-11-24'
  });

  /* ===== VTE and pulmonary embolism ===== */
  add({
    id: 'wellspe', name: 'Wells score for PE', domain: 'VTE and pulmonary embolism', scen: ['pe'],
    blurb: 'Clinical probability of pulmonary embolism.',
    inputs: ['hr', 'cancer'], local: ['peDvtSigns', 'peLikely', 'peImmob', 'priorVTE', 'haemoptysis'],
    calc: function (p) {
      if (p.hr == null) return res({ missing: ['hr'] });
      var r = UT.wellsPE({ dvtSigns: p.peDvtSigns, peLikely: p.peLikely, hr: p.hr, immob: p.peImmob, priorVTE: p.priorVTE, haemoptysis: p.haemoptysis, cancer: p.cancer });
      var c = r.score < 2 ? 0 : r.score <= 6 ? 1 : 3;
      return res({ value: r.score, unit: '/ 12.5', cat: c, catLabel: r.three + ' probability',
        lines: ['Two-tier: ' + r.two + ' (cut-off 4)', 'PE prevalence in this band ≈ ' + r.rate3 + '%'],
        action: r.two === 'PE unlikely' ? 'PE unlikely: a negative D-dimer rules out PE without imaging.' : 'PE likely: go straight to CT pulmonary angiography.',
        summary: 'Wells PE ' + r.score + ' (' + r.three.toLowerCase() + ' probability, ' + r.two.toLowerCase() + ')' });
    },
    source: 'Wells et al., Thromb Haemost 2000; 2019 ESC pulmonary embolism guidelines.',
    status: 'new'
  });

  add({
    id: 'wellsdvt', name: 'Wells score for DVT', domain: 'VTE and pulmonary embolism', scen: ['pe'],
    blurb: 'Clinical probability of deep vein thrombosis.',
    inputs: ['cancer'], local: ['dvtParalysis', 'dvtBedridden', 'dvtTender', 'dvtLegSwollen', 'dvtCalf3', 'dvtPitting', 'dvtCollateral', 'priorDVT', 'dvtAltDx'],
    calc: function (p) {
      var r = UT.wellsDVT({ cancer: p.cancer, paralysis: p.dvtParalysis, bedridden: p.dvtBedridden, tender: p.dvtTender, legSwollen: p.dvtLegSwollen,
        calf3: p.dvtCalf3, pitting: p.dvtPitting, collateral: p.dvtCollateral, priorDVT: p.priorDVT, altDx: p.dvtAltDx });
      var c = r.score <= 0 ? 0 : r.score <= 2 ? 1 : 3;
      return res({ value: r.score, unit: 'points', cat: c, catLabel: r.three + ' probability',
        lines: ['Two-tier: ' + r.two + ' (cut-off 2)', 'DVT prevalence in this band ≈ ' + r.rate3 + '%'],
        action: r.two === 'DVT unlikely' ? 'DVT unlikely: a negative D-dimer rules out DVT without ultrasound.' : 'DVT likely: proximal compression ultrasound.',
        summary: 'Wells DVT ' + r.score + ' (' + r.three.toLowerCase() + ' probability, ' + r.two.toLowerCase() + ')' });
    },
    source: 'Wells et al., Lancet 1997 / NEJM 2003.',
    status: 'new'
  });

  add({
    id: 'pesi', name: 'PESI and sPESI', domain: 'VTE and pulmonary embolism', scen: ['pe'],
    blurb: '30-day mortality after acute PE; sPESI shown alongside.',
    inputs: ['age', 'sex', 'hr', 'sbp', 'rr', 'temp', 'spo2', 'cancer', 'hf', 'copd'], local: ['altered'],
    calc: function (p) {
      var m = need(p, ['age', 'sex', 'hr', 'sbp']);
      if (m.length) return res({ missing: m });
      var r = UT.pesi({ age: p.age, male: p.sex === 'male', cancer: p.cancer, hf: p.hf, lung: p.copd, hr: p.hr, sbp: p.sbp,
        rr: p.rr == null ? 0 : p.rr, temp: p.temp == null ? 37 : p.temp, altered: p.altered, spo2: p.spo2 == null ? 100 : p.spo2 });
      var sp = UT.spesi({ age: p.age, cancer: p.cancer, cardioresp: p.hf || p.copd, hr: p.hr, sbp: p.sbp, spo2: p.spo2 == null ? 100 : p.spo2 });
      var unk = ['rr', 'temp', 'spo2'].filter(function (k) { return p[k] == null; });
      return res({ value: r.score, unit: 'points', cat: [0, 0, 1, 2, 3][r.cls], catLabel: 'Class ' + r.label,
        lines: ['30-day mortality ≈ ' + r.rate + '%', 'sPESI ' + sp.score + (sp.items.length ? ' (' + sp.items.join(', ') + ')' : ' — low risk, 30-day mortality ≈ 1%')],
        warn: unk.length ? ['Not entered, so scored as normal: ' + unk.map(function (k) { return F[k].label; }).join(', ') + '.'] : [],
        action: r.cls <= 1 && sp.score === 0 ? 'PESI class I–II and sPESI 0: low risk, suitable for early discharge or home treatment if no RV dysfunction.' : 'PESI class III–V or sPESI ≥ 1: admit; assess RV function and troponin.',
        summary: 'PESI ' + r.score + ' (class ' + r.label + ', 30-day mortality ' + r.rate + '%), sPESI ' + sp.score });
    },
    source: 'Aujesky et al., Am J Respir Crit Care Med 2005; Jiménez et al., Arch Intern Med 2010.',
    status: 'new'
  });

  add({
    id: 'escpe', name: 'ESC PE risk class', domain: 'VTE and pulmonary embolism', scen: ['pe'],
    blurb: 'Early mortality risk in acute PE: high, intermediate-high, intermediate-low or low.',
    inputs: ['age', 'sex', 'hr', 'sbp', 'rr', 'temp', 'spo2', 'cancer', 'hf', 'copd'], local: ['haemoUnstable', 'rvDysfunction', 'peTroponin', 'altered'],
    calc: function (p) {
      var m = need(p, ['age', 'sex', 'hr', 'sbp']);
      if (m.length) return res({ missing: m });
      var r = UT.pesi({ age: p.age, male: p.sex === 'male', cancer: p.cancer, hf: p.hf, lung: p.copd, hr: p.hr, sbp: p.sbp,
        rr: p.rr == null ? 0 : p.rr, temp: p.temp == null ? 37 : p.temp, altered: p.altered, spo2: p.spo2 == null ? 100 : p.spo2 });
      var sp = UT.spesi({ age: p.age, cancer: p.cancer, cardioresp: p.hf || p.copd, hr: p.hr, sbp: p.sbp, spo2: p.spo2 == null ? 100 : p.spo2 });
      var notLow = r.cls >= 2 || sp.score >= 1, both = p.rvDysfunction && p.peTroponin;
      var cls, cat, act;
      if (p.haemoUnstable) { cls = 'High'; cat = 3; act = 'High risk: primary reperfusion (systemic thrombolysis, or catheter or surgical embolectomy) and haemodynamic support.'; }
      else if (notLow && both) { cls = 'Intermediate-high'; cat = 2; act = 'Intermediate-high: admit to a monitored bed; anticoagulate and watch for decompensation, with rescue reperfusion ready.'; }
      else if (notLow) { cls = 'Intermediate-low'; cat = 1; act = 'Intermediate-low: admit and anticoagulate.'; }
      else { cls = 'Low'; cat = 0; act = 'Low risk: consider early discharge and treatment at home if the Hestia criteria are met.'; }
      var L = ['PESI class ' + r.label + ' · sPESI ' + sp.score];
      L.push(!p.rvDysfunction && !p.peTroponin ? 'RV function and troponin not recorded' : 'RV dysfunction ' + (p.rvDysfunction ? 'yes' : 'no') + ' · troponin ' + (p.peTroponin ? 'raised' : 'normal'));
      if (!p.haemoUnstable && notLow && !both && (p.rvDysfunction || p.peTroponin)) L.push('Only one of RV dysfunction and raised troponin: still intermediate-low.');
      return res({ value: cls, text: true, cat: cat, catLabel: 'ESC 2019 class', lines: L, action: act,
        warn: !p.haemoUnstable && !p.rvDysfunction && !p.peTroponin ? ['Echo or CT RV assessment and troponin not recorded: classed on PESI alone.'] : [],
        summary: 'ESC PE risk: ' + cls.toLowerCase() + ' (PESI ' + r.label + ', sPESI ' + sp.score + ')' });
    },
    source: 'Konstantinides et al., 2019 ESC guidelines on acute pulmonary embolism, Table 8.',
    status: 'new'
  });

  /* ===== Cardiomyopathy and endocarditis ===== */
  add({
    id: 'hcmscd', name: 'HCM Risk-SCD', domain: 'Cardiomyopathy and valve', scen: [],
    blurb: '5-year risk of sudden cardiac death in hypertrophic cardiomyopathy, to guide ICD decisions.',
    inputs: ['age', 'wallThick', 'laDiam', 'lvotGrad'], local: ['famSCD', 'nsvt', 'unexpSyncope'],
    calc: function (p) {
      var m = need(p, ['age', 'wallThick', 'laDiam', 'lvotGrad']);
      if (m.length) return res({ missing: m });
      var pi = 0.15939858 * p.wallThick - 0.00294271 * p.wallThick * p.wallThick + 0.0259082 * p.laDiam + 0.00446131 * p.lvotGrad +
        0.4583082 * (p.famSCD ? 1 : 0) + 0.82639195 * (p.nsvt ? 1 : 0) + 0.71650361 * (p.unexpSyncope ? 1 : 0) - 0.01799934 * p.age;
      var v = 100 * (1 - Math.pow(0.998, Math.exp(pi)));
      var c = v < 4 ? 0 : v < 6 ? 1 : 3;
      var w = [];
      if (p.wallThick < 10 || p.wallThick > 35) w.push('Validated for maximal wall thickness 10–35 mm.');
      if (p.age < 16) w.push('Not validated under 16 years; use the paediatric model.');
      return res({ value: v, unit: '% at 5 years', cat: c, catLabel: ['Low', 'Intermediate', '', 'High'][c], warn: w,
        lines: ['Wall thickness ' + f1(p.wallThick) + ' mm · LA ' + f1(p.laDiam) + ' mm · LVOT gradient ' + f0(p.lvotGrad) + ' mmHg' +
          (p.famSCD ? ' · family history of SCD' : '') + (p.nsvt ? ' · NSVT' : '') + (p.unexpSyncope ? ' · unexplained syncope' : '')],
        action: c === 3 ? 'ESC 2023: 5-year risk ≥ 6%, an ICD should be considered (IIa).' : c === 1 ? 'ESC 2023: 5-year risk 4 to < 6%, an ICD may be considered (IIb).' : 'ESC 2023: 5-year risk < 4%, an ICD is generally not indicated unless other features are present.',
        summary: 'HCM Risk-SCD ' + f1(v) + '% at 5 years (' + ['low', 'intermediate', '', 'high'][c] + ')' });
    },
    source: 'O’Mahony et al., Eur Heart J 2014; thresholds from the 2023 ESC cardiomyopathy guidelines. Excludes patients after cardiac arrest, with sustained VT, EF < 50%, apical aneurysm or recent myectomy or alcohol ablation.',
    status: 'new'
  });

  add({
    id: 'duke', name: 'Duke-ISCVID criteria', domain: 'Cardiomyopathy and valve', scen: [],
    blurb: '2023 Duke-ISCVID criteria for infective endocarditis: definite, possible or rejected.',
    inputs: [],
    local: ['dukeMicro1', 'dukeMicro2', 'dukeImaging', 'dukeSurgical', 'dukePredispose', 'dukeFever', 'dukeVascular', 'dukeImmune', 'dukeMicroMinor', 'dukeImagingMinor', 'dukePhysExam'],
    calc: function (p) {
      var majList = [['dukeMicro1', 'typical organisms from 2 or more separate blood cultures'], ['dukeMicro2', 'persistently positive cultures, or Coxiella, Bartonella or T. whipplei'],
        ['dukeImaging', 'imaging: vegetation, abscess, pseudoaneurysm, new dehiscence or abnormal PET/CT activity'], ['dukeSurgical', 'endocarditis confirmed at surgery or on pathology']];
      var minList = [['dukePredispose', 'predisposing heart condition or injection drug use'], ['dukeFever', 'fever above 38 °C'], ['dukeVascular', 'vascular phenomena (emboli, mycotic aneurysm, Janeway lesions)'],
        ['dukeImmune', 'immunological phenomena (glomerulonephritis, Osler nodes, Roth spots, rheumatoid factor)'], ['dukeMicroMinor', 'microbiological evidence not meeting a major criterion'],
        ['dukeImagingMinor', 'imaging evidence not meeting a major criterion'], ['dukePhysExam', 'new valvular regurgitation on examination']];
      var maj = majList.filter(function (x) { return p[x[0]]; }), min = minList.filter(function (x) { return p[x[0]]; });
      var M = maj.length, N = min.length;
      var v, c, act;
      if (M >= 2 || (M === 1 && N >= 3) || N >= 5) { v = 'Definite'; c = 3; act = 'Definite endocarditis: treat as such, and refer to the endocarditis team.'; }
      else if ((M === 1 && N >= 1) || N >= 3) { v = 'Possible'; c = 1; act = 'Possible endocarditis: repeat blood cultures and imaging (TOE, PET/CT or cardiac CT) before deciding.'; }
      else { v = 'Rejected'; c = 0; act = 'Criteria not met. A firm alternative diagnosis, resolution within 4 days of antibiotics, or no pathology at surgery would reject the diagnosis outright.'; }
      return res({ value: v, text: true, cat: c, catLabel: M + ' major · ' + N + ' minor',
        lines: [M ? 'Major: ' + maj.map(function (x) { return x[1]; }).join('; ') : 'No major criteria', N ? 'Minor: ' + min.map(function (x) { return x[1]; }).join('; ') : 'No minor criteria'],
        action: act,
        summary: 'Duke-ISCVID: ' + v.toLowerCase() + ' endocarditis (' + M + ' major, ' + N + ' minor)' });
    },
    source: 'Fowler et al., Clin Infect Dis 2023 (2023 Duke-ISCVID criteria). Definite: 2 major, or 1 major + 3 minor, or 5 minor. Possible: 1 major + 1 minor, or 3 minor.',
    status: 'new'
  });

  /* ===== Utilities ===== */
  add({
    id: 'kidney', name: 'Kidney function', domain: 'Utilities', scen: ['prev', 'af', 'acs', 'pci', 'surg', 'preop'],
    blurb: 'eGFR (CKD-EPI 2021, race-free) and creatinine clearance (Cockcroft-Gault).',
    inputs: ['cr', 'age', 'sex', 'wt'],
    calc: function (p, d) {
      var m = need(p, ['cr', 'age', 'sex']);
      if (m.length) return res({ missing: m });
      var st = RS.gStage(d.egfr);
      return res({ value: d.egfr, unit: 'mL/min/1.73 m²', cat: d.egfr >= 60 ? 0 : d.egfr >= 30 ? 1 : d.egfr >= 15 ? 2 : 3, catLabel: 'CKD ' + st,
        lines: [d.crcl != null ? 'CrCl ' + f0(d.crcl) + ' mL/min (Cockcroft-Gault, actual weight)' : 'Enter weight for creatinine clearance.'],
        summary: 'eGFR ' + f0(d.egfr) + ' (' + st + ')' + (d.crcl != null ? ', CrCl ' + f0(d.crcl) : '') });
    },
    source: 'Inker et al., NEJM 2021 (CKD-EPI 2021); Cockcroft & Gault, Nephron 1976.',
    status: 'new', utility: 1
  });

  add({
    id: 'body', name: 'Body size', domain: 'Utilities', scen: ['prev', 'preop'],
    blurb: 'BMI and body surface area (Mosteller).',
    inputs: ['wt', 'ht'],
    calc: function (p, d) {
      var m = need(p, ['wt', 'ht']);
      if (m.length) return res({ missing: m });
      var b = d.bmi, c = b < 25 ? 0 : b < 30 ? 1 : b < 35 ? 2 : 3;
      var lab = b < 18.5 ? 'Underweight' : b < 25 ? 'Normal' : b < 30 ? 'Overweight' : 'Obese';
      return res({ value: b, unit: 'kg/m²', cat: b < 18.5 ? 1 : c, catLabel: lab, lines: ['BSA ' + d.bsa.toFixed(2) + ' m² (Mosteller)'],
        summary: 'BMI ' + f1(b) + ', BSA ' + d.bsa.toFixed(2) + ' m²' });
    },
    source: 'WHO BMI classes; Mosteller, NEJM 1987.',
    status: 'new', utility: 1
  });

  add({
    id: 'lipids', name: 'Lipid calculations', domain: 'Utilities', scen: ['prev'],
    blurb: 'Non-HDL cholesterol and calculated LDL (Sampson/NIH and Friedewald).',
    inputs: ['tc', 'hdl', 'tg', 'ldl'],
    calc: function (p, d) {
      var m = need(p, ['tc', 'hdl']);
      if (m.length) return res({ missing: m });
      var lines = [];
      if (d.ldlS != null) lines.push('LDL (Sampson/NIH) ' + f0(d.ldlS) + ' mg/dL' + (p.tg > 800 ? ' · TG > 800: measure LDL directly' : ''));
      if (d.ldlF != null) lines.push('LDL (Friedewald) ' + f0(d.ldlF) + ' mg/dL' + (p.tg >= 150 ? ' · under-estimates LDL when TG ≥ 150; prefer Sampson' : ''));
      else if (p.tg >= 400) lines.push('TG ≥ 400 mg/dL: Friedewald not valid.');
      if (p.tg == null) lines.push('Enter triglycerides for calculated LDL.');
      if (p.ldl != null) lines.push('LDL measured ' + f0(p.ldl) + ' mg/dL');
      return res({ value: d.nonhdl, unit: 'mg/dL non-HDL', cat: null, lines: lines,
        summary: 'Non-HDL ' + f0(d.nonhdl) + (d.ldlS != null ? ', LDL (Sampson) ' + f0(d.ldlS) : '') + (p.ldl != null ? ', LDL measured ' + f0(p.ldl) : '') + ' mg/dL' });
    },
    source: 'Sampson et al., JAMA Cardiol 2020 (NIH equation; matches MDCalc); Friedewald et al., Clin Chem 1972.',
    status: 'new', utility: 1
  });

  add({
    id: 'bp', name: 'Blood pressure', domain: 'Utilities', scen: [],
    blurb: 'Mean arterial pressure and pulse pressure.',
    inputs: ['sbp', 'dbp'],
    calc: function (p, d) {
      var m = need(p, ['sbp', 'dbp']);
      if (m.length) return res({ missing: m });
      return res({ value: d.map, unit: 'mmHg MAP', cat: null, lines: ['Pulse pressure ' + f0(d.pp) + ' mmHg'], summary: 'MAP ' + f0(d.map) + ', PP ' + f0(d.pp) + ' mmHg' });
    },
    source: 'MAP = DBP + (SBP − DBP) / 3.',
    status: 'new', utility: 1
  });

  var CONV = { chol: [38.67, 'mg/dL', 'mmol/L'], tg: [88.57, 'mg/dL', 'mmol/L'], cr: [1 / 88.4, 'mg/dL', 'µmol/L'], glu: [18.016, 'mg/dL', 'mmol/L'], hb: [0.1, 'g/dL', 'g/L'] };
  add({
    id: 'convert', name: 'Unit converter', domain: 'Utilities', scen: [],
    blurb: 'Cholesterol, triglycerides, creatinine, glucose and haemoglobin.',
    inputs: [], local: ['convAn', 'convDir', 'convVal'], noSummary: 1,
    calc: function (p) {
      var c = CONV[p.convAn || 'chol'];
      if (p.convVal == null) return res({ missing: ['convVal'], hint: 'Enter a value in ' + (p.convDir === 'toConv' ? c[2] : c[1]) + '.' });
      var toSI = p.convDir !== 'toConv', v = toSI ? p.convVal / c[0] : p.convVal * c[0];
      var dp = (toSI ? c[2] : c[1]) === 'µmol/L' || (toSI ? c[2] : c[1]) === 'g/L' ? 0 : 2;
      return res({ value: v, dp: dp, unit: toSI ? c[2] : c[1], cat: null, lines: [p.convVal + ' ' + (toSI ? c[1] : c[2]) + ' = ' + v.toFixed(dp) + ' ' + (toSI ? c[2] : c[1])] });
    },
    source: 'Standard conversion factors.',
    status: 'new', utility: 1
  });

  var SCEN = [
    ['all', 'All scores'], ['fav', 'Favourites'], ['prev', 'Prevention visit'], ['af', 'New AF'], ['acs', 'ACS admission'], ['hf', 'Heart failure'], ['pe', 'Suspected PE'], ['pci', 'PCI / cath lab'], ['surg', 'Cardiac surgery'], ['preop', 'Pre-op']
  ];

  function compute(state) {
    var p = all(state), d = derive(p), out = {};
    S.forEach(function (s) { try { out[s.id] = s.calc(p, d, state); } catch (e) { out[s.id] = res({ error: String(e && e.message || e) }); } });
    return { p: p, d: d, r: out };
  }

  return { dasiOf: dasiOf, F: F, GROUPS: GROUPS, SCORES: S, SCEN: SCEN, val: val, isAuto: isAuto, all: all, derive: derive, compute: compute, CAT4: CAT4 };
})();
if (typeof module !== 'undefined') module.exports = DEF;
