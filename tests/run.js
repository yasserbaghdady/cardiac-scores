// Run: node tests/run.js   — every change re-runs every case.
const fs = require('fs'), vm = require('vm'), path = require('path');
const src = f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');
const ctx = { module: undefined, console };
vm.createContext(ctx);
vm.runInContext(src('engine-core.js') + '\n' + src('engine-extra.js') + '\n' + src('scores.js') + '\nthis.RS=RS;this.UT=UT;this.DEF=DEF;', ctx);
const { RS, UT, DEF } = ctx;
const OLD = require('./old-engine.js');

let pass = 0, fail = 0;
function ok(cond, name, info) { if (cond) pass++; else { fail++; console.log('FAIL', name, info === undefined ? '' : JSON.stringify(info)); } }
function near(a, b, tol, name) { ok(a != null && Math.abs(a - b) <= tol, name, { got: a, want: b }); }
const run = s => DEF.compute(s).r;

/* ---- utilities, values checked by hand from the published formulas ---- */
near(RS.egfr(1.0, 60, 'female'), 64.5, 0.3, 'CKD-EPI 2021 F60 Cr1.0 ≈ 64');
near(RS.egfr(1.0, 50, 'male'), 91.7, 0.3, 'CKD-EPI 2021 M50 Cr1.0 ≈ 92');
near(UT.crcl(1.2, 80, 'female', 60), 35.4, 0.1, 'Cockcroft-Gault F80 60kg Cr1.2');
near(UT.bsa(70, 175), 1.84, 0.01, 'Mosteller 70kg 175cm');
near(UT.friedewald(200, 50, 150), 120, 0.01, 'Friedewald 200/50/150');
ok(UT.friedewald(200, 50, 450) === null, 'Friedewald invalid at TG ≥ 400');
near(UT.map(120, 80), 93.3, 0.1, 'MAP 120/80');

/* ---- points scores, worked by hand from the original papers ---- */
let r = run({ age: 76, sex: 'female', htn: true });
ok(r.cha2ds2va.value === 3, 'CHA2DS2-VA 76F HTN = 3', r.cha2ds2va.value);
ok(/VASc 4/.test(r.cha2ds2va.lines[0]), 'CHA2DS2-VASc 76F HTN = 4');
ok(r.cha2ds2va.cat === 3, 'VA ≥ 2 → OAC recommended');
r = run({ age: 64, sex: 'male', pad: true });
ok(r.cha2ds2va.value === 1, 'PAD auto-ticks vascular disease → VA 1', r.cha2ds2va.value);
r = run({ age: 64, sex: 'male', pad: true, vasc: false });
ok(r.cha2ds2va.value === 0, 'manual untick overrides auto', r.cha2ds2va.value);

r = run({ age: 70, antiplatelet: true });
ok(r.hasbled.value === 2, 'HAS-BLED elderly + antiplatelet = 2', r.hasbled.value);
r = run({ age: 70, sbp: 170, cr: 2.5, cevd: true });
ok(r.hasbled.value === 4, 'HAS-BLED auto HTN + renal + stroke + elderly = 4', r.hasbled.value);

r = run({ highRiskSurg: true, cad: true, cr: 2.5 });
ok(r.rcri.value === 3 && r.rcri.catLabel === 'Class IV', 'RCRI 3 → class IV', r.rcri);
r = run({ dm: true, insulin: true });
ok(r.rcri.value === 1, 'RCRI insulin-treated diabetes = 1');

r = run({ age: 65, hr: 95, sbp: 110, cr: 1.3, killip: '1', stdev: true, enz: true });
ok(r.grace.value === 168, 'GRACE Granger table: 58+15+43+10+0+0+28+14 = 168', r.grace.value);
ok(r.grace.cat === 3, 'GRACE > 140 → high');

r = run({ age: 70, htn: true, dm: true, smoker: true, stdev: true });
ok(r.timiua.value === 3 && /13.2/.test(r.timiua.lines[0]), 'TIMI UA age+3RF+ST = 3 → 13.2%', r.timiua);
r = run({ age: 76, sbp: 95, hr: 110, killip: '2', wt: 60, dm: true });
ok(r.timistemi.value === 3 + 1 + 3 + 2 + 2 + 1, 'TIMI STEMI = 12', r.timistemi.value);

/* ---- DOAC rules (EU SmPC) ---- */
const dz = o => run(Object.assign({ sex: 'female' }, o)).doac;
ok(dz({ age: 82, wt: 58, cr: 1.1 }).value === '2.5 mg twice daily', 'apixaban 2 criteria → 2.5');
let x = dz({ age: 82, wt: 70, cr: 1.0 });
ok(x.value === '5 mg twice daily' && x.warn.some(w => /alone/.test(w)), 'apixaban 1 criterion → 5 mg + warning', x);
ok(dz({ age: 70, wt: 70, cr: 2.2 }).value === '2.5 mg twice daily', 'apixaban CrCl 15–29 → 2.5 (EU)');
ok(dz({ age: 70, wt: 40, cr: 3.5 }).value === 'Not recommended', 'apixaban CrCl < 15 → avoid');
ok(dz({ drug: 'rivaroxaban', age: 75, wt: 65, cr: 1.4 }).value === '15 mg once daily with food', 'rivaroxaban CrCl 15–49 → 15 mg');
ok(dz({ drug: 'rivaroxaban', age: 55, wt: 80, cr: 0.9 }).value === '20 mg once daily with food', 'rivaroxaban CrCl ≥ 50 → 20 mg');
ok(dz({ drug: 'rivaroxaban', age: 55, wt: 80, cr: 0.9, liverCP: 'B' }).value === 'Not recommended', 'rivaroxaban Child-Pugh B → avoid');
const vt = o => dz(Object.assign({ indication: 'vte' }, o));
ok(/^10 mg twice daily for 7 days/.test(vt({ age: 85, wt: 55, cr: 1.6 }).value), 'apixaban VTE: no reduction for age/weight/Cr');
x = vt({ age: 70, wt: 70, cr: 2.2 });
ok(/^10 mg/.test(x.value) && x.warn.some(w => /15–29/.test(w)), 'apixaban VTE CrCl 15–29 → caution, same dose', x);
x = vt({ drug: 'rivaroxaban', age: 75, wt: 65, cr: 1.4 });
ok(/^15 mg twice daily for 21 days/.test(x.value) && x.lines.some(w => /after day 21, 15 mg/.test(w)), 'rivaroxaban VTE CrCl < 50 → 15 mg option after day 21', x);
ok(vt({ drug: 'rivaroxaban', age: 70, wt: 40, cr: 3.5 }).value === 'Not recommended', 'rivaroxaban VTE CrCl < 15 → avoid');
ok(dz({ age: 70, wt: 70 }).missing.indexOf('cr') > -1, 'DOAC lists creatinine as missing');

/* ---- equation scores: new app must match the clinic tool exactly (port fidelity) ---- */
function rnd(a, b) { return a + Math.random() * (b - a); }
let fid = 0;
for (let i = 0; i < 400; i++) {
  const s = { age: Math.round(rnd(40, 89)), sex: Math.random() < .5 ? 'male' : 'female', sbp: Math.round(rnd(100, 190)), tc: Math.round(rnd(140, 300)),
    hdl: Math.round(rnd(30, 80)), smoker: Math.random() < .3, dm: Math.random() < .3, cr: +rnd(0.6, 2.0).toFixed(2), wt: Math.round(rnd(55, 110)), ht: Math.round(rnd(150, 190)),
    hba1c: +rnd(5.5, 10).toFixed(1), dmAge: 0, famhx: Math.random() < .2, bptx: Math.random() < .5, statin: Math.random() < .3 };
  s.dmAge = Math.max(25, s.age - Math.round(rnd(1, 15)));
  const res = run(s), egfr = OLD.egfr(s.cr, s.age, s.sex), bmi = OLD.bmi(s.wt, s.ht);
  const o2 = OLD.score2Auto({ age: s.age, sex: s.sex, sbp: s.sbp, tc: s.tc, hdl: s.hdl, smoker: s.smoker, dm: s.dm, dmAge: s.dmAge, hba1c: s.hba1c, egfr, famhx: s.famhx });
  if (o2.value != null) { near(res.score2.value, o2.value, 1e-9, 'SCORE2 fidelity #' + i); fid++; }
  if (s.age <= 79) {
    const op = OLD.prevent({ age: s.age, sex: s.sex, sbp: s.sbp, tc: s.tc, hdl: s.hdl, dm: s.dm, smoker: s.smoker, egfr, bmi, bptx: s.bptx, statin: s.statin, hba1c: s.hba1c });
    if (op.ok) { near(res.prevent.value, op.y10.total_cvd, 1e-9, 'PREVENT fidelity #' + i); fid++; }
  }
  const s2 = Object.assign({}, s, { cad: true, ascvdYrs: 5, antiplatelet: true });
  const os = OLD.smart2({ age: s.age, sex: s.sex, smoker: s.smoker, dm: s.dm, sbp: s.sbp, tc: s.tc, hdl: s.hdl, egfr, years: 5, cad: true, antithromb: true, region: 'veryhigh' });
  near(run(s2).smart2.value, os.value, 1e-9, 'SMART2 fidelity #' + i); fid++;
}


/* ---- official calculators, checked 7 Nov 2026 (MDCalc for SCORE2 family; AHA online calculator for PREVENT) ---- */
const MM = 38.67;
[[{ age: 45, sex: 'male', smoker: 0, sbp: 120, tc: 4.9, hdl: 1.4 }, 3.7], [{ age: 55, sex: 'female', smoker: 1, sbp: 145, tc: 5.9, hdl: 1.25 }, 20.1],
 [{ age: 65, sex: 'male', smoker: 1, sbp: 165, tc: 6.7, hdl: 1.0 }, 39.7]].forEach(([o, w], i) => near(RS.score2(Object.assign({}, o, { tc: o.tc * MM, hdl: o.hdl * MM })), w, 0.05, 'SCORE2 vs MDCalc #' + i));
[[{ age: 72, sex: 'male', dm: 0, smoker: 0, sbp: 140, tc: 5.2, hdl: 1.3 }, 29.7], [{ age: 78, sex: 'female', dm: 1, smoker: 1, sbp: 160, tc: 5.9, hdl: 1.15 }, 68.6],
 [{ age: 85, sex: 'female', dm: 0, smoker: 0, sbp: 150, tc: 4.8, hdl: 1.4 }, 54.7]].forEach(([o, w], i) => near(RS.score2OP(Object.assign({}, o, { tc: o.tc * MM, hdl: o.hdl * MM })), w, 0.05, 'SCORE2-OP vs MDCalc #' + i));
const pct = mm => mm / 10.929 + 2.15;
[[{ age: 55, sex: 'male', smoker: 0, sbp: 135, tc: 5.2, hdl: 1.15, dmAge: 50, hba1c: pct(58), egfr: 85 }, 18.6], [{ age: 62, sex: 'female', smoker: 1, sbp: 150, tc: 6.2, hdl: 1.1, dmAge: 48, hba1c: pct(75), egfr: 55 }, 64.3],
 [{ age: 48, sex: 'female', smoker: 0, sbp: 125, tc: 4.6, hdl: 1.5, dmAge: 45, hba1c: pct(48), egfr: 100 }, 7.6]].forEach(([o, w], i) => near(RS.score2DM(Object.assign({}, o, { tc: o.tc * MM, hdl: o.hdl * MM })), w, 0.05, 'SCORE2-Diabetes vs MDCalc #' + i));
const PV = o => RS.prevent(o).y10;
[[{ age: 45, sex: 'female', tc: 4.9 * MM, hdl: 1.55 * MM, sbp: 118, egfr: 100, bmi: 24 }, 1.02], [{ age: 55, sex: 'male', tc: 5.7 * MM, hdl: 1.1 * MM, sbp: 142, egfr: 80, bmi: 29, smoker: 1, bptx: 1 }, 12.19],
 [{ age: 68, sex: 'male', tc: 6.2 * MM, hdl: 1.0 * MM, sbp: 160, egfr: 55, bmi: 32, dm: 1, smoker: 1, bptx: 1, statin: 1 }, 40.92], [{ age: 50, sex: 'male', tc: 5.0 * MM, hdl: 1.2 * MM, sbp: 130, egfr: 90, bmi: 26, uacr: 60 }, 4.46]]
  .forEach(([o, w], i) => near(PV(o).total_cvd, w, 0.01, 'PREVENT vs MDCalc #' + i));
[[{ age: 60, sex: 'female', tc: 213, hdl: 50, sbp: 135, egfr: 70, bmi: 27, dm: 1, bptx: 1, hba1c: 7.8 }, [16, 9.5, 8.5], [0.5, 0.06, 0.06]],
 [{ age: 55, sex: 'female', tc: 200, hdl: 55, sbp: 125, egfr: 90, bmi: 31, hba1c: 6.0 }, [3.4, 2.1, 1.5], [0.05, 0.05, 0.05]],
 [{ age: 58, sex: 'male', tc: 210, hdl: 42, sbp: 145, egfr: 65, bmi: 30, smoker: 1, bptx: 1, hba1c: 6.1, uacr: 40 }, [16.4, 10.4, 7.3], [0.05, 0.05, 0.05]]]
  .forEach(([o, w, tol], i) => { const y = PV(o); near(y.total_cvd, w[0], tol[0], 'PREVENT CVD vs AHA #' + i); near(y.ascvd, w[1], tol[1], 'PREVENT ASCVD vs AHA #' + i); near(y.heart_failure, w[2], tol[2], 'PREVENT HF vs AHA #' + i); });


/* ---- SMART2 vs U-Prevent (signed in, 7 Nov 2026) ---- */
const SM = (o, at, region) => UT.smart2(Object.assign({}, o, { tc: o.tc * MM, hdl: o.hdl * MM, at, region })).value;
const smA = { age: 60, sex: 'male', smoker: 0, dm: 0, sbp: 130, tc: 4.7, hdl: 1.2, hscrp: 1.5, egfr: 85, years: 3, cad: 1 };
const smB = { age: 70, sex: 'female', smoker: 1, dm: 1, sbp: 150, tc: 5.7, hdl: 1.0, hscrp: 4, egfr: 50, years: 8, cad: 1, pad: 1 };
const smC = { age: 55, sex: 'male', smoker: 0, dm: 0, sbp: 125, tc: 4.2, hdl: 1.3, hscrp: 0.8, egfr: 95, years: 1, cevd: 1 };
const smD = { age: 66, sex: 'female', smoker: 0, dm: 0, sbp: 140, tc: 5.5, hdl: 1.4, hscrp: 3, egfr: 70, years: 4, aaa: 1 };
const smD2 = Object.assign({}, smD, { aaa: 0, cad: 1 });
[[smA, 'aspirin', 'veryhigh', 42.0], [smA, 'dapt', 'veryhigh', 29.1], [smA, 'aspdoac', 'veryhigh', 23.8], [smA, 'none', 'veryhigh', 56.4],
 [smB, 'aspirin', 'veryhigh', 96.5], [smC, 'aspirin', 'high', 15.4], [smC, 'none', 'high', 22.5], [smC, 'dapt', 'high', 10.0], [smC, 'aspdoac', 'high', 8.0],
 [smD, 'none', 'low', 26.7], [smD, 'none', 'moderate', 30.4], [smD, 'none', 'high', 39.2], [smD, 'none', 'veryhigh', 66.9], [smD, 'aspirin', 'veryhigh', 51.6],
 [smD2, 'none', 'veryhigh', 65.6], [smD2, 'aspirin', 'veryhigh', 50.4]]
  .forEach(([o, at, rg, w], i) => near(SM(o, at, rg), w, 0.06, 'SMART2 vs U-Prevent #' + i + ' ' + at + ' ' + rg));


/* ---- pre-op set ---- */
r = run({ age: 70, guptaFS: 'partial', asaClass: '3', cr: 1.8, guptaProc: 'aortic' });
near(r.gupta.value, 5.17, 0.01, 'Gupta: 70 y, partial, ASA 3, Cr > 1.5, aortic = 5.17%');
r = run({ age: 50, asaClass: '1', guptaProc: 'breast' });
near(r.gupta.value, 100 * Math.exp(-5.25 + 1 - 5.17 - 0.10 - 1.61) / (1 + Math.exp(-5.25 + 1 - 5.17 - 0.10 - 1.61)), 1e-9, 'Gupta creatinine unknown scores −0.10');
const all12 = {}; for (let i = 1; i <= 12; i++) all12['dasi' + i] = true;
r = run(all12); near(r.dasi.value, 58.2, 1e-9, 'DASI maximum 58.2'); ok(/9\.9 METs/.test(r.dasi.lines[0]), 'DASI 58.2 ≈ 9.9 METs', r.dasi.lines);
r = run({ dasi1: true, dasi2: true, dasi3: true, age: 70, surgProc: 'H:aortic', cad: true });
near(r.dasi.value, 7.25, 1e-9, 'DASI self-care + indoors + 1–2 blocks = 7.25'); ok(r.dasi.cat === 3, 'DASI 7.25 → < 4 METs');
ok(r.escpath.lines.some(l => /Stress imaging/.test(l)) && r.escpath.lines.some(l => /echo/.test(l)), 'pathway: high-risk surgery, CAD, poor FC (auto from DASI) → echo + stress imaging', r.escpath.lines);
r = run({ age: 45, surgProc: 'L:eye' });
ok(r.esccat.value === 'Low' && /no further cardiac testing/.test(r.escpath.lines[0]), 'pathway: young, no risk, low-risk surgery → proceed', r.escpath);
r = run({ age: 70, surgProc: 'I:neuroortho' });
ok(r.escpath.lines.some(l => /hs-troponin/.test(l)) && !r.escpath.lines.some(l => /Stress/.test(l)), 'pathway: age ≥ 65, intermediate surgery → ECG, troponin, NP; no stress test', r.escpath.lines);
r = run({ age: 70, cad: true, surgProc: 'H:aortic', urgency: 'urgent' });
ok(/do not delay/.test(r.escpath.lines[0]), 'pathway: urgent surgery → no delay');
ok(run({ surgProc: 'H:pancreas' }).esccat.value === 'High' && run({ surgProc: 'I:evar' }).esccat.value === 'Intermediate', 'ESC categories: pancreas high, EVAR intermediate');
ok(run({ surgProc: 'H:aortic' }).rcri.value === 1 && run({ surgProc: 'L:eye' }).rcri.value === 0, 'RCRI high-risk surgery auto-ticked from the ESC procedure');
/* Sampson vs MDCalc (mmol/L inputs) */
[[5.2, 1.1, 1.7, 3.40], [6.0, 0.9, 4.5, 3.26], [4.0, 1.0, 2.5, 2.05]].forEach(([a, b, c, w], i) => near(UT.sampson(a * MM, b * MM, c * 88.57) / MM, w, 0.012, 'Sampson vs MDCalc #' + i));


/* ---- field registry: no key defined twice (a silent override broke TIMI once) ---- */
{ const keys = [...src('scores.js').matchAll(/^    (\w+): [NBC]\(/gm)].map(m => m[1]); const dup = keys.filter((k, i) => keys.indexOf(k) !== i); ok(!dup.length, 'no duplicate field keys', dup); }


/* ---- Phase 2: checked against MDCalc on 9 Nov 2026 ---- */
[[65,130,42,125,'male',0,0,0,1],[75,95,38,100,'female',1,0,1,39],[85,85,35,75,'male',0,1,0,39],[95,110,32,45,'female',0,0,0,54],[105,190,30,25,'male',1,1,1,74],[115,205,40,10,'male',0,0,0,54],
 [125,150,36.9,90,'male',0,0,0,32],[70,90,31,15,'male',0,0,0,56],[80,100,34,30,'male',0,0,0,47],[120,120,37,60,'male',0,0,0,45],[90,180,39.9,120,'male',0,0,0,13],[100,200,33.9,121,'male',0,0,0,16],[110,201,30.9,91,'male',0,0,0,29]]
  .forEach((c, i) => ok(UT.crusade({ hr: c[0], sbp: c[1], hct: c[2], crcl: c[3], sex: c[4], chf: c[5], vasc: c[6], dm: c[7] }).score === c[8], 'CRUSADE vs MDCalc #' + i, c));
const PD = (age, hbgl, wbc, crcl, bleed) => UT.precise({ age, hb: hbgl / 10, wbc, crcl, bleed }).score;
[[53,118,6.4,94.4,0,6],[53,118,6.4,94.4,1,31],[72,105,9.5,48,0,39],[81,112,7.2,35,1,65],[66,131,11,72,0,21],[58,98,22,15,1,81],[45,140,4,120,1,26],[77,109,13.3,61,0,39],[69,117,8.1,83,0,19],[85,101,16,27,0,60]]
  .forEach((c, i) => ok(PD(c[0], c[1], c[2], c[3], c[4]) === c[5], 'PRECISE-DAPT vs MDCalc mixed #' + i, [c, PD(c[0], c[1], c[2], c[3], c[4])]));
({ 46:0,48:0,50:0,51:0,52:1,53:1,54:2,56:3,58:4,60:5,61:5,62:6,64:7,65:7,66:8,67:8,68:8,69:9,70:9,71:10,72:10,74:11,76:12,78:13,80:14,82:15,84:16,86:17,88:18,89:18,90:19,92:19,94:19 });
Object.entries({ 46:0,48:0,50:0,51:0,52:1,53:1,54:2,56:3,58:4,60:5,61:5,62:6,64:7,65:7,66:8,67:8,68:8,69:9,70:9,71:10,72:10,74:11,76:12,78:13,80:14,82:15,84:16,86:17,88:18,89:18,90:19,92:19,94:19 })
  .forEach(([a, w]) => ok(PD(+a, 130, 5, 100, 0) === w, 'PRECISE-DAPT age ' + a));
Object.entries({ 96:15,98:15,100:15,102:13,104:12,106:10,108:9,110:7,112:6,114:4,116:3,118:1,120:0,122:0,124:0 }).forEach(([h, w]) => ok(PD(50, +h, 5, 100, 0) === w, 'PRECISE-DAPT Hb ' + h));
Object.entries({ 4:0,5:0,6:1,8:3,10:5,12:7,14:9,16:11,18:13,20:15,22:15 }).forEach(([x, w]) => ok(PD(50, 130, +x, 100, 0) === w, 'PRECISE-DAPT WBC ' + x));
Object.entries({ 130:0,110:0,100:0,95:1,90:3,80:5,70:8,60:10,50:13,40:15,30:18,20:20,10:23,5:24,0:25 }).forEach(([x, w]) => ok(PD(50, 130, 5, +x, 0) === w, 'PRECISE-DAPT CrCl ' + x));
near(UT.euroscore({ age: 55, sex: 'male', crcl: 100 }), 0.50, 0.005, 'EuroSCORE II baseline vs MDCalc');
near(UT.euroscore({ age: 72, sex: 'female', iddm: 1, crcl: 70, nyha: 3, art: 1, lv: 'mod', mi: 1, ph: 'mod', urg: 'urgent', weight: 'two' }), 15.08, 0.005, 'EuroSCORE II B vs MDCalc');
near(UT.euroscore({ age: 81, sex: 'male', lung: 1, mob: 1, dialysis: 1, crit: 1, nyha: 4, ccs4: 1, prev: 1, endo: 1, lv: 'vpoor', ph: 'sev', urg: 'salvage', weight: 'three', aorta: 1 }), 98.60, 0.005, 'EuroSCORE II C vs MDCalc');
near(UT.euroscore({ age: 64, sex: 'male', crcl: 40, nyha: 2, lv: 'poor', urg: 'emergency', weight: 'single' }), 6.31, 0.005, 'EuroSCORE II D vs MDCalc');

/* ---- Phase 2: hand-checked against the original papers and ESC table ---- */
r = run({ age: 70, htn: true, dm: true, smoker: true, heartHx: '2', heartEcg: '1', heartTn: '1' });
ok(r.heart.value === 8 && r.heart.cat === 3, 'HEART 2+1+2+2+1 = 8 high', r.heart.value);
r = run({ age: 40, heartHx: '0', heartEcg: '0', heartTn: '0' }); ok(r.heart.value === 0 && r.heart.cat === 0, 'HEART 0 low');
r = run({ age: 50, cad: true, heartHx: '1', heartEcg: '0', heartTn: '0' }); ok(r.heart.value === 4, 'HEART known CAD scores 2 for risk factors', r.heart.value);
r = run({ age: 50, htn: true, wt: 100, ht: 170, heartHx: '0', stdev: true, heartTn: '2' }); ok(r.heart.value === 0 + 2 + 1 + 1 + 2, 'HEART: ECG auto from ST deviation, obesity counted (2 RF → 1)', r.heart.value);
ok(run({ age: 50 }).heart.missing.length === 3, 'HEART asks for history, ECG, troponin');
const T = (assay, t0, t1, onset3h) => UT.tn01({ assay, t0, t1, onset3h }).out;
ok(T('elecsys', 4, null, true) === 'out', '0/1h Elecsys < 5 with onset > 3 h → rule-out');
ok(T('elecsys', 4, null, false) === null, '0/1h Elecsys < 5 early presenter → needs 1-h value');
ok(T('elecsys', 10, 11, false) === 'out', '0/1h Elecsys 10 → 11 → rule-out');
ok(T('elecsys', 10, 13, false) === 'observe', '0/1h Elecsys 10 → 13 (Δ3) → observe');
ok(T('elecsys', 30, 36, false) === 'in', '0/1h Elecsys Δ ≥ 5 → rule-in');
ok(T('elecsys', 52, null, false) === 'in', '0/1h Elecsys ≥ 52 → rule-in');
ok(T('elecsys', 20, 22, false) === 'observe', '0/1h Elecsys 20 → 22 → observe');
ok(T('architect', 4, 5, false) === 'out' && T('architect', 4, 6, false) === 'observe' && T('architect', 10, 16, false) === 'in' && T('architect', 64, null, false) === 'in', '0/1h Architect cut-offs');
ok(T('access', 4, 7, false) === 'out' && T('access', 4, 8, false) === 'observe' && T('access', 20, 35, false) === 'in', '0/1h Access cut-offs');
r = run({ age: 78, sex: 'male', cr: 1.4, dm: true, hct: 37, contrast: 250, mHypo: true });
ok(r.mehran.value === 5 + 4 + 3 + 3 + 2 + 2 && r.mehran.catLabel === 'Very high', 'Mehran 19: hypotension, age, anaemia, diabetes, 250 mL, eGFR 40–60', [r.mehran.value, DEF.compute({ age: 78, sex: 'male', cr: 1.4 }).d.egfr]);
r = run({ age: 60, sex: 'female', cr: 0.8, hb: 13 }); ok(r.mehran.value === 0 && r.mehran.warn.some(w => /estimated/.test(w)), 'Mehran 0; Hct estimated from Hb');
r = run({ age: 60, sex: 'male', cr: 1.0, hb: 14, plt: 250 }); ok(r.archbr.value === 'Not HBR', 'ARC-HBR none');
r = run({ age: 76, sex: 'male', cr: 1.0, hb: 12.5, plt: 250 }); ok(r.archbr.value === 'High bleeding risk' && /0 major · 2 minor/.test(r.archbr.catLabel), 'ARC-HBR 2 minor (age, Hb) → HBR', r.archbr);
r = run({ age: 60, sex: 'female', cr: 1.0, hb: 11.5, plt: 250 }); ok(r.archbr.value === 'Not HBR' && /1 minor/.test(r.archbr.catLabel), 'ARC-HBR 1 minor only → not HBR');
r = run({ age: 60, sex: 'male', cr: 1.0, hb: 14, plt: 250, anticoag: true }); ok(r.archbr.value === 'High bleeding risk', 'ARC-HBR OAC (auto from profile) = major');
r = run({ age: 60, sex: 'male', cr: 3.5, hb: 14, plt: 80 }); ok(/2 major/.test(r.archbr.catLabel), 'ARC-HBR eGFR < 30 and platelets < 100 = 2 major', r.archbr.catLabel);
r = run({ wt: 80, cr: 2.0, age: 70, sex: 'male', contrast: 250 }); near(r.contrastmax.value, 200, 1e-9, 'Cigarroa 5 × 80 / 2.0 = 200 mL'); ok(r.contrastmax.cat === 3, 'contrast 250 above limit');
r = run({ wt: 80, cr: 0.8 }); near(r.contrastmax.value, 300, 1e-9, 'Cigarroa capped at 300 mL');
r = run({ age: 72, sex: 'female', cr: 1.0, wt: 62, dm: true, insulin: true, pad: true, ef: 40, euNyha: '3', euMI: true, euPH: 'mod', euUrg: 'urgent', euWt: 'two' });
near(r.euroscore2.value, UT.euroscore({ age: 72, sex: 'female', iddm: 1, crcl: UT.crcl(1.0, 72, 'female', 62), nyha: 3, art: 1, lv: 'mod', mi: 1, ph: 'mod', urg: 'urgent', weight: 'two' }), 1e-9, 'EuroSCORE II card: profile feeds insulin, PAD, EF and CrCl');
r = run({ age: 70, sex: 'male', hr: 85, sbp: 110, hb: 12, cr: 1.2, wt: 80, killip: '2', pad: true });
ok(r.crusade.ok && r.crusade.warn.length === 1 && r.crusade.value === UT.crusade({ hct: 36, crcl: UT.crcl(1.2, 70, 'male', 80), hr: 85, sbp: 110, sex: 'male', chf: 1, vasc: 1 }).score, 'CRUSADE card: Hct from Hb, HF signs from Killip, vascular from PAD', r.crusade);


/* ---- Phase 3a: H2FPEF vs MDCalc (9 patients, 24 Nov 2026) ---- */
const H2 = (age, bmi, ee, pasp, af) => { const ht = 170, wt = bmi * (ht / 100) ** 2;
  return run({ age, wt, ht, eePrime: ee, pasp, af: !!af }).h2fpef.value; };
[[60,25,10,30,0,31.0],[75,35,16,45,0,92.3],[75,35,16,45,1,98.5],[45,22,7,22,0,7.3],[55,31,9,28,1,78.1],
 [68,27.5,12.4,38,0,62.5],[82,24,19,55,1,97.9],[70,33,8,20,0,50.2],[50,40,15,33,1,95.2]]
  .forEach(([a,b,e,s,f,w], i) => near(H2(a,b,e,s,f), w, 0.1, 'H2FPEF vs MDCalc #' + i));  // MDCalc rounds; worst gap 0.06% at p≈50%
r = run({ age: 70, wt: 95, ht: 172, eePrime: 12, pasp: 40, af: true, twoAntiHTN: true });
ok(/points 9\/9/.test(r.h2fpef.summary), 'H2FPEF points: all six items = 9/9', r.h2fpef.summary);
r = run({ age: 55, wt: 70, ht: 175, eePrime: 8, pasp: 25 });
ok(/points 0\/9/.test(r.h2fpef.summary) && /discounted/.test(r.h2fpef.lines[0]), 'H2FPEF points 0/9 → discounted');
r = run({ age: 70, wt: 95, ht: 172, eePrime: 12, trv: 3.0, af: true });
ok(r.h2fpef.ok && r.h2fpef.lines.some(l => /estimated from TR velocity/.test(l)), 'H2FPEF: PASP derived from TR velocity (4v²+5)');
near(DEF.compute({ trv: 3.0 }).d.pasp, 41, 1e-9, 'PASP from TRV 3.0 = 41 mmHg');
r = run({ age: 70, wt: 95, ht: 172, eePrime: 12, pasp: 40, ef: 35 });
ok(r.h2fpef.warn.some(w => /preserved EF/.test(w)), 'H2FPEF warns when EF < 50%');

/* ---- QTc (formulas, hand-computed anchors) ---- */
const QT = (qt, hr, sex) => run({ qt, hr, sex }).qtc;
near(QT(400, 60).value, 400, 1e-6, 'QTc at HR 60 equals QT');
r = QT(400, 100); near(r.value, 516.3978, 1e-3, 'Bazett 400 ms @ 100 bpm');
ok(/Fridericia 474 · Framingham 462 · Hodges 470/.test(r.lines[0]), 'QTc other formulas @ 100 bpm', r.lines[0]);
ok(r.lines.some(l => /differ by 42 ms/.test(l)), 'QTc flags the 42 ms Bazett–Fridericia gap at 100 bpm', r.lines);
ok(!QT(400, 60).lines.some(l => /differ by/.test(l)), 'QTc: no gap note at 60 bpm');
r = QT(440, 50); near(r.value, 401.6632, 1e-3, 'Bazett 440 ms @ 50 bpm');
ok(QT(460, 60, 'male').cat === 2 && QT(460, 60, 'female').cat === 0, 'QTc thresholds differ by sex (450 vs 460)');
ok(QT(520, 60, 'male').cat === 3 && /torsades/.test(QT(520, 60, 'male').action), 'QTc > 500 → markedly prolonged');
ok(QT(330, 60, 'male').cat === 1, 'QTc < 340 → short');
ok(QT(400, 60).lines.some(l => /Sex not entered/.test(l)), 'QTc notes when sex is missing');

/* ---- HFA-PEFF (Pieske 2019 step 2), hand-checked ---- */
const HP = o => run(o).hfapeff;
r = HP({ ePrimeSept: 5, lavi: 40, ntprobnp: 400 });
ok(r.value === 6 && r.catLabel === 'HFpEF diagnosed', 'HFA-PEFF all three major = 6', r.value);
r = HP({ eePrime: 11, rwt: 0.45, ntprobnp: 150 });
ok(r.value === 3 && r.catLabel === 'Intermediate', 'HFA-PEFF all three minor = 3', r.value);
r = HP({ eePrime: 7, lavi: 25, ntprobnp: 80 });
ok(r.value === 0 && r.catLabel === 'Unlikely', 'HFA-PEFF nothing met = 0');
r = HP({ af: true, eePrime: 16, lavi: 38, ntprobnp: 400 });
ok(r.value === 4 && /AF thresholds used/.test(r.lines[2]), 'HFA-PEFF in AF: NT-proBNP 400 and LAVI 38 are only minor = 4', [r.value, r.lines]);
ok(HP({ ntprobnp: 400 }).value === 2 && HP({ af: true, ntprobnp: 700 }).value === 2, 'HFA-PEFF biomarker majors, sinus vs AF');
ok(HP({ sex: 'male', lvmi: 160, rwt: 0.5 }).value === 2 && HP({ sex: 'female', lvmi: 130, rwt: 0.5 }).value === 2, 'HFA-PEFF LV mass major differs by sex');
ok(HP({ sex: 'male', lvmi: 130, rwt: 0.5 }).value === 1, 'HFA-PEFF male LVMI 130 is minor only');
ok(HP({ trv: 3.0 }).value === 2 && HP({ pasp: 41 }).value === 2, 'HFA-PEFF functional major from TR velocity or PASP');
ok(HP({ gls: 14 }).value === 1 && HP({ wallThick: 13 }).value === 1, 'HFA-PEFF minor criteria: GLS and wall thickness');
r = HP({ eePrime: 16 });
ok(r.value === 2 && r.warn.some(w => /morphological or biomarker/.test(w)), 'HFA-PEFF warns which domains are unscored', r.warn);
ok(!HP({}).ok, 'HFA-PEFF with nothing entered asks for input');
ok(DEF.SCORES.filter(s => s.id === 'hfapeff')[0].review === 1, 'HFA-PEFF is flagged for clinical review');


/* ---- Phase 3b: MAGGIC vs MDCalc (24 Nov 2026; 51 patients probed, 12 kept here) ---- */
/* ef, age, sbp, bmi, cr(µmol/L), nyha(0=I), male, smoker, dm, copd, hf18, noBB, noACE, points, 1yr%, 3yr% */
[[45,50,150,30,80,0,0,0,0,0,0,0,0,0,1.5,3.9],[38,50,150,30,80,0,0,1,0,0,0,0,0,3,2,5.2],[45,50,145,22,100,0,1,0,0,1,0,0,0,7,2.9,7.7],
 [32,57,145,30,80,1,0,0,0,1,1,0,0,11,4.3,11.1],[22,57,125,30,80,0,0,1,0,1,1,0,1,16,7,17.5],[38,50,125,22,190,0,1,1,1,1,1,0,1,21,11.1,26.9],
 [38,67,115,27,120,1,0,1,1,0,1,1,1,26,17.5,39.7],[22,57,145,17,80,3,1,1,1,1,1,0,1,31,26.9,55.6],[22,77,105,10,120,0,1,0,1,1,0,1,0,36,39.8,72.5],
 [38,82,105,27,190,3,0,0,1,0,1,1,0,41,55.7,86.6],[27,77,125,17,300,3,0,1,0,1,1,1,1,46,72.5,95.3],[27,82,105,17,300,3,0,0,1,0,1,1,1,50,84.2,98.5]]
  .forEach((c, i) => { const m = UT.maggic({ ef: c[0], age: c[1], sbp: c[2], bmi: c[3], cr: c[4], nyha: c[5] + 1,
      male: c[6], smoker: c[7], dm: c[8], copd: c[9], hf18: c[10], noBB: c[11], noACE: c[12] });
    ok(m.score === c[13], 'MAGGIC points vs MDCalc #' + i, [m.score, c[13]]);
    ok(m.y1 === c[14] && m.y3 === c[15], 'MAGGIC mortality vs MDCalc #' + i, [m.y1, m.y3, c[14], c[15]]); });
/* the card converts creatinine from mg/dL and reads NYHA, meds and BMI from the profile */
r = run({ age: 67, sex: 'male', ef: 38, sbp: 115, wt: 78, ht: 170, cr: 120 / 88.4, nyha: '2', smoker: true, dm: true, hf18: true, bblocker: false, acei: false });
ok(r.maggic.ok && r.maggic.value === UT.maggic({ ef: 38, age: 67, sbp: 115, bmi: 78 / 1.7 ** 2, cr: 120, nyha: 2, male: 1, smoker: 1, dm: 1, hf18: 1, noBB: 1, noACE: 1 }).score,
  'MAGGIC card matches the engine through the profile', r.maggic);
ok(r.maggic.warn.some(w => /beta blocker or an ACE/.test(w)), 'MAGGIC warns that it scored the patient as untreated');
ok(!run({ age: 67, sex: 'male', ef: 38, sbp: 115, wt: 78, ht: 170, cr: 1.4 }).maggic.ok, 'MAGGIC needs NYHA class');

/* ---- Wells, PESI and the ESC PE class (hand-checked against the papers) ---- */
r = run({ hr: 110, cancer: true, peDvtSigns: true, peLikely: true });
ok(r.wellspe.value === 8.5 && r.wellspe.catLabel === 'High probability' && /PE likely/.test(r.wellspe.lines[0]), 'Wells PE 3+3+1.5+1 = 8.5 high', r.wellspe.value);
ok(run({ hr: 80 }).wellspe.value === 0 && run({ hr: 80 }).wellspe.catLabel === 'Low probability', 'Wells PE 0 → low');
ok(run({ hr: 101 }).wellspe.value === 1.5 && run({ hr: 100 }).wellspe.value === 0, 'Wells PE heart rate cut-off is above 100');
r = run({ hr: 90, peDvtSigns: true, priorVTE: true });
ok(r.wellspe.value === 4.5 && /PE likely/.test(r.wellspe.lines[0]), 'Wells PE 4.5 → likely on the two-tier rule');
r = run({ cancer: true, dvtTender: true, dvtLegSwollen: true, dvtCalf3: true });
ok(r.wellsdvt.value === 4 && r.wellsdvt.catLabel === 'High probability', 'Wells DVT 4 → high');
ok(run({ cancer: true, dvtTender: true, dvtAltDx: true }).wellsdvt.value === 0, 'Wells DVT: alternative diagnosis subtracts 2');
ok(run({ priorVTE: true }).wellsdvt.value === 1, 'Wells DVT: previous DVT auto-ticked from previous VTE');
r = run({ age: 70, sex: 'male', hr: 115, sbp: 95, rr: 32, temp: 35.5, spo2: 88, cancer: true, altered: true });
ok(r.pesi.value === 70 + 10 + 30 + 20 + 30 + 20 + 20 + 60 + 20 && r.pesi.catLabel === 'Class V', 'PESI all items = 280, class V', r.pesi.value);
ok(/sPESI 4 \(cancer, HR ≥ 110, SBP < 100, SpO₂ < 90%\)/.test(r.pesi.lines[1]), 'sPESI: 4 items (age 70 and no cardiopulmonary disease do not count)', r.pesi.lines[1]);
ok(/sPESI 6/.test(run({ age: 85, sex: 'male', hr: 115, sbp: 95, spo2: 88, cancer: true, copd: true }).pesi.lines[1]), 'sPESI: all 6 items', run({ age: 85, sex: 'male', hr: 115, sbp: 95, spo2: 88, cancer: true, copd: true }).pesi.lines[1]);
r = run({ age: 50, sex: 'female', hr: 80, sbp: 130 });
ok(r.pesi.value === 50 && r.pesi.catLabel === 'Class I' && /sPESI 0/.test(r.pesi.lines[1]), 'PESI 50 → class I, sPESI 0');
ok(r.pesi.warn.some(w => /scored as normal/.test(w)), 'PESI says which vitals it assumed normal');
ok(run({ age: 50, sex: 'female', hr: 80, sbp: 130 }).escpe.value === 'Low', 'ESC PE: PESI I and sPESI 0 → low');
ok(run({ age: 50, sex: 'female', hr: 80, sbp: 130, haemoUnstable: true }).escpe.value === 'High', 'ESC PE: instability → high');
r = run({ age: 82, sex: 'female', hr: 80, sbp: 130, rvDysfunction: true, peTroponin: true });
ok(r.escpe.value === 'Intermediate-high', 'ESC PE: not low + RV dysfunction + troponin → intermediate-high');
r = run({ age: 82, sex: 'female', hr: 80, sbp: 130, rvDysfunction: true });
ok(r.escpe.value === 'Intermediate-low' && r.escpe.lines.some(l => /Only one of/.test(l)), 'ESC PE: only one of the two → intermediate-low');
ok(run({ age: 82, sex: 'female', hr: 80, sbp: 130, enz: true }).escpe.lines[1].indexOf('troponin raised') > -1, 'ESC PE reads raised troponin from the ACS section');
ok(/not recorded/.test(run({ age: 82, sex: 'female', hr: 80, sbp: 130 }).escpe.lines[1]), 'ESC PE does not claim troponin is normal when it was never entered');

/* ---- HCM Risk-SCD (O'Mahony 2014 equation) ---- */
const HC = o => run(o).hcmscd;
r = HC({ age: 40, wallThick: 20, laDiam: 45, lvotGrad: 30 });
near(r.value, 100 * (1 - 0.998 ** Math.exp(0.15939858 * 20 - 0.00294271 * 400 + 0.0259082 * 45 + 0.00446131 * 30 - 0.01799934 * 40)), 1e-9, 'HCM Risk-SCD equation');
ok(HC({ age: 40, wallThick: 20, laDiam: 45, lvotGrad: 30, nsvt: true }).value > r.value, 'HCM Risk-SCD: NSVT raises the risk');
ok(HC({ age: 30, wallThick: 32, laDiam: 55, lvotGrad: 80, famSCD: true, nsvt: true, unexpSyncope: true }).cat === 3, 'HCM Risk-SCD: high-risk patient ≥ 6%');
ok(HC({ age: 60, wallThick: 15, laDiam: 38, lvotGrad: 0 }).cat === 0, 'HCM Risk-SCD: low-risk patient < 4%');
ok(HC({ age: 40, wallThick: 40, laDiam: 45, lvotGrad: 30 }).warn.length === 1, 'HCM Risk-SCD warns outside 10–35 mm');

/* ---- Duke-ISCVID 2023 ---- */
const DK = o => run(o).duke;
ok(DK({ dukeMicro1: true, dukeImaging: true }).value === 'Definite', 'Duke: 2 major → definite');
ok(DK({ dukeMicro1: true, dukeFever: true, dukeVascular: true, dukeImmune: true }).value === 'Definite', 'Duke: 1 major + 3 minor → definite');
ok(DK({ dukeFever: true, dukeVascular: true, dukeImmune: true, dukePredispose: true, dukeMicroMinor: true }).value === 'Definite', 'Duke: 5 minor → definite');
ok(DK({ dukeMicro1: true, dukeFever: true }).value === 'Possible', 'Duke: 1 major + 1 minor → possible');
ok(DK({ dukeFever: true, dukeVascular: true, dukeImmune: true }).value === 'Possible', 'Duke: 3 minor → possible');
ok(DK({ dukeMicro1: true }).value === 'Possible' === false && DK({ dukeMicro1: true }).value === 'Rejected', 'Duke: 1 major alone → rejected', DK({ dukeMicro1: true }).value);
ok(DK({}).value === 'Rejected' && /0 major · 0 minor/.test(DK({}).catLabel), 'Duke: nothing ticked → rejected');

/* ---- edge cases ---- */
r = run({ age: 60, sex: 'male', sbp: 140, tc: 220, hdl: 45, cad: true });
ok(r.score2.na && /SMART2/.test(r.score2.na), 'SCORE2 not applied with ASCVD');
r = run({ age: 35, sex: 'male', sbp: 140, tc: 220, hdl: 45 });
ok(r.score2.value == null && !!r.score2.na, 'SCORE2 under 40 → note, no number');
r = run({ age: 55, sex: 'male', sbp: 140, tc: 220, hdl: 45, dm: true });
ok(r.score2.missing.indexOf('dmAge') > -1 && r.score2.missing.indexOf('hba1c') > -1, 'SCORE2-Diabetes asks for its inputs', r.score2.missing);
r = run({});
ok(Object.values(r).every(v => !v.error), 'empty profile: no score throws');

console.log(`${pass} passed, ${fail} failed (${fid} equation fidelity checks)`);
process.exit(fail ? 1 : 0);
