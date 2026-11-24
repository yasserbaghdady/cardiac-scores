/* ===== Utilities and new scores (Phase 1a) — pure functions, no DOM ===== */
var UT = (function () {
  function crcl(cr, age, sex, wt) {           // Cockcroft-Gault, actual body weight, mL/min
    if (!(cr > 0) || !(age > 0) || !(wt > 0)) return null;
    return (140 - age) * wt * (sex === 'female' ? 0.85 : 1) / (72 * cr);
  }
  function bsa(wt, hcm) {                     // Mosteller, m²
    return (wt > 0 && hcm > 0) ? Math.sqrt(wt * hcm / 3600) : null;
  }
  function friedewald(tc, hdl, tg) {          // mg/dL; invalid when TG ≥ 400
    if (!(tc > 0 && hdl > 0 && tg > 0) || tg >= 400) return null;
    return tc - hdl - tg / 5;
  }
  function sampson(tc, hdl, tg) {             // NIH equation, mg/dL; valid to TG 800
    if (!(tc > 0 && hdl > 0 && tg > 0) || tg > 800) return null;
    var nh = tc - hdl;
    return tc / 0.948 - hdl / 0.971 - (tg / 8.56 + tg * nh / 2140 - tg * tg / 16100) - 9.44;
  }
  function map(sbp, dbp) { return (sbp > 0 && dbp > 0) ? dbp + (sbp - dbp) / 3 : null; }

  /* DOAC dose for non-valvular AF: apixaban and rivaroxaban only (the two available in Egypt).
     Follows the EU SmPC where EU and US labels differ. Returns a structured result. */
  function doac(p) {
    var r = { drug: p.drug, dose: null, cat: 0, reasons: [], warn: [], missing: [] };
    if (!(p.age > 0)) r.missing.push('age');
    if (!(p.wt > 0)) r.missing.push('wt');
    if (!(p.cr > 0)) r.missing.push('cr');
    if (!p.sex) r.missing.push('sex');
    if (r.missing.length) return r;
    var cl = crcl(p.cr, p.age, p.sex, p.wt);
    r.crcl = cl;
    if (p.inhibitor) r.warn.push('Strong CYP3A4 and P-gp inhibitor (e.g. ketoconazole, itraconazole, ritonavir): avoid.');
    if (p.inducer) r.warn.push('Strong inducer (rifampicin, carbamazepine, phenytoin, phenobarbital, St John’s wort): avoid, levels fall.');
    if (p.bleedDrugs) r.warn.push('Antiplatelet or NSAID co-prescribed: review the indication, bleeding risk rises.');
    if (p.liver === 'C') { r.dose = 'Not recommended'; r.cat = 3; r.reasons.push('Child-Pugh C liver disease.'); return r; }
    if (cl < 15) { r.dose = 'Not recommended'; r.cat = 3; r.reasons.push('CrCl below 15 mL/min.'); return r; }
    if (p.indication === 'vte') return doacVTE(p, r, cl);
    if (p.drug === 'apixaban') {
      var c = [];
      if (p.age >= 80) c.push('age ≥ 80');
      if (p.wt <= 60) c.push('weight ≤ 60 kg');
      if (p.cr >= 1.5) c.push('creatinine ≥ 1.5 mg/dL');
      if (cl < 30) { r.dose = '2.5 mg twice daily'; r.cat = 2; r.reasons.push('CrCl 15–29 mL/min (EU label).'); }
      else if (c.length >= 2) { r.dose = '2.5 mg twice daily'; r.cat = 2; r.reasons.push('2 or more of: ' + c.join(', ') + '.'); }
      else {
        r.dose = '5 mg twice daily'; r.cat = 0;
        r.reasons.push(c.length ? 'Only 1 reduction criterion (' + c[0] + '); full dose.' : 'No dose-reduction criteria.');
        if (c.length === 1) r.warn.push('One criterion alone does not justify 2.5 mg; under-dosing raises stroke risk.');
      }
      if (p.liver === 'B') r.warn.push('Child-Pugh B: use with caution.');
    } else {
      if (p.liver === 'B') { r.dose = 'Not recommended'; r.cat = 3; r.reasons.push('Child-Pugh B liver disease (rivaroxaban).'); return r; }
      if (cl < 50) { r.dose = '15 mg once daily with food'; r.cat = 2; r.reasons.push('CrCl 15–49 mL/min.'); }
      else { r.dose = '20 mg once daily with food'; r.cat = 0; r.reasons.push('CrCl ≥ 50 mL/min.'); }
      if (cl >= 15 && cl < 30) r.warn.push('CrCl 15–29: use with caution.');
    }
    return r;
  }

  /* VTE (DVT/PE) treatment, EU SmPC. Age and weight do not change VTE doses; only the
     rivaroxaban maintenance phase has a renal option. */
  function doacVTE(p, r, cl) {
    if (p.drug === 'apixaban') {
      if (p.liver === 'B') r.warn.push('Child-Pugh B: use with caution.');
      r.dose = '10 mg twice daily for 7 days, then 5 mg twice daily'; r.cat = 0;
      r.reasons.push('Standard VTE regimen; no dose reduction for age, weight or creatinine.');
      r.reasons.push('Extended prevention after ≥ 6 months: 2.5 mg twice daily.');
      if (cl < 30) { r.cat = 1; r.warn.push('CrCl 15–29: use with caution (limited data).'); }
    } else {
      if (p.liver === 'B') { r.dose = 'Not recommended'; r.cat = 3; r.reasons.push('Child-Pugh B liver disease (rivaroxaban).'); return r; }
      r.dose = '15 mg twice daily for 21 days, then 20 mg once daily, with food'; r.cat = 0;
      r.reasons.push('Standard VTE regimen; the first 21 days are not reduced for kidney function.');
      if (cl < 50) { r.cat = 1; r.reasons.push('CrCl 15–49: after day 21, 15 mg once daily if bleeding risk outweighs recurrence risk.'); }
      if (cl < 30) r.warn.push('CrCl 15–29: use with caution.');
      r.reasons.push('Extended prevention after ≥ 6 months: 10 mg once daily (20 mg if recurrence risk is high).');
    }
    return r;
  }

  /* SMART2 as U-Prevent computes it: the published model plus U-Prevent's antithrombotic effects,
     expressed relative to single antiplatelet therapy (measured against U-Prevent, 7 Nov 2026). */
  var SM_AT = { none: 0.42144206, aspirin: 0, dapt: -0.4615, aspdoac: -0.6955 };
  var SM_EO = { veryhigh: 0.2285371, high: 0.5085825, moderate: 0.6973285, low: 0.81590 };
  function smart2(p) {
    var q = {}; for (var k in p) q[k] = p[k]; q.antithromb = true;
    var b = RS.smart2(q), lp = b.lp + (SM_AT[p.at || 'aspirin'] || 0);
    var eo = SM_EO[p.region || 'veryhigh'];
    return { value: 100 * (1 - Math.pow(1 - 0.165822797, Math.exp(lp + 0.0463729 - Math.log(eo)))), crpImputed: b.crpImputed, lp: lp };
  }

  /* ===== Phase 2: ACS and intervention (pure functions) ===== */
  function band(x, edges, pts) { for (var i = 0; i < edges.length; i++) if (x <= edges[i]) return pts[i]; return pts[edges.length]; }

  /* CRUSADE in-hospital major bleeding (Subherwal 2009). hct %, crcl mL/min (Cockcroft-Gault). */
  function crusade(o) {
    var p = {
      hct: o.hct < 31 ? 9 : o.hct < 34 ? 7 : o.hct < 37 ? 3 : o.hct < 40 ? 2 : 0,
      crcl: band(o.crcl, [15, 30, 60, 90, 120], [39, 35, 28, 17, 7, 0]),
      hr: band(o.hr, [70, 80, 90, 100, 110, 120], [0, 1, 3, 6, 8, 10, 11]),
      sex: o.sex === 'female' ? 8 : 0, chf: o.chf ? 7 : 0, vasc: o.vasc ? 6 : 0, dm: o.dm ? 6 : 0,
      sbp: band(o.sbp, [90, 100, 120, 180, 200], [10, 8, 5, 1, 3, 5])
    };
    var s = p.hct + p.crcl + p.hr + p.sex + p.chf + p.vasc + p.dm + p.sbp;
    var g = s <= 20 ? 0 : s <= 30 ? 1 : s <= 40 ? 2 : s <= 50 ? 3 : 4;
    return { score: s, parts: p, grade: g, label: ['Very low', 'Low', 'Moderate', 'High', 'Very high'][g], rate: [3.1, 5.5, 8.6, 11.9, 19.5][g] };
  }

  /* ESC 0/1-h hs-troponin algorithm, assay-specific cut-offs in ng/L:
     [very low, low, no 1-h delta, high, 1-h delta] (2020/2023 ESC NSTE-ACS guidelines). */
  var TN = {
    elecsys: ['hs-cTnT Elecsys (Roche)', 5, 12, 3, 52, 5], architect: ['hs-cTnI Architect (Abbott)', 4, 5, 2, 64, 6],
    centaur: ['hs-cTnI Centaur (Siemens)', 3, 6, 3, 120, 12], access: ['hs-cTnI Access (Beckman Coulter)', 4, 5, 4, 50, 15],
    clarity: ['hs-cTnI Clarity (Singulex)', 1, 2, 1, 30, 6], vitros: ['hs-cTnI Vitros (Ortho)', 1, 2, 1, 40, 4],
    pathfast: ['hs-cTnI Pathfast (LSI Medience)', 3, 4, 3, 90, 20], triage: ['hs-cTnI TriageTrue (Quidel)', 4, 5, 3, 60, 8],
    dimension: ['hs-cTnI Dimension EXL (Siemens)', 9, 9, 5, 160, 100]
  };
  function tn01(o) {
    var c = TN[o.assay], r = { assay: c[0], cut: c.slice(1) };
    if (o.t0 < c[1] && o.onset3h) { r.out = 'out'; r.why = '0-h value below ' + c[1] + ' ng/L with chest pain onset more than 3 h ago.'; return r; }
    if (o.t0 >= c[4]) { r.out = 'in'; r.why = '0-h value ≥ ' + c[4] + ' ng/L.'; return r; }
    if (o.t1 == null) { r.out = null; r.why = 'Repeat troponin at 1 h.'; return r; }
    var d = Math.abs(o.t1 - o.t0); r.delta = d;
    if (d >= c[5]) { r.out = 'in'; r.why = '1-h change ' + (Math.round(d * 10) / 10) + ' ng/L (≥ ' + c[5] + ').'; }
    else if (o.t0 < c[2] && d < c[3]) { r.out = 'out'; r.why = '0-h value below ' + c[2] + ' ng/L and 1-h change below ' + c[3] + ' ng/L.'; }
    else { r.out = 'observe'; r.why = 'Neither rule-out nor rule-in criteria met.'; }
    return r;
  }

  /* PRECISE-DAPT (Costa 2017). The official model is not published as a formula; these slopes were
     recovered from the MDCalc calculator on 9 Nov 2026 and reproduce it exactly on all cases tested.
     hb g/dL, wbc 10^9/L, crcl mL/min. */
  function precise(o) {
    var cl = function (x, a, b) { return Math.min(b, Math.max(a, x)); };
    var raw = 0.4696 * (cl(o.age, 50, 90) - 50) + 7.335 * (12 - cl(o.hb, 10, 12)) + 1.031 * (cl(o.wbc, 5, 20) - 5) + 0.254 * (100 - cl(o.crcl, 0, 100)) + (o.bleed ? 25.68 : 0);
    var s = Math.round(raw), g = s <= 10 ? 0 : s <= 17 ? 1 : s <= 24 ? 2 : 3;
    return { score: s, raw: raw, grade: g, label: ['Very low', 'Low', 'Moderate', 'High'][g] };
  }

  /* EuroSCORE II (Nashef 2012) */
  function euroscore(o) {
    var x = -5.324537 + 0.0285181 * (o.age <= 60 ? 1 : o.age - 59);
    if (o.sex === 'female') x += 0.2196434;
    x += o.dialysis ? 0.6421508 : o.crcl > 85 ? 0 : o.crcl > 50 ? 0.303553 : 0.8592256;
    if (o.art) x += 0.5360268; if (o.mob) x += 0.2407181; if (o.prev) x += 1.118599; if (o.lung) x += 0.1886564;
    if (o.endo) x += 0.6194522; if (o.crit) x += 1.086517; if (o.iddm) x += 0.3542749;
    x += [0, 0, 0.1070545, 0.2958358, 0.5597929][+o.nyha || 1];
    if (o.ccs4) x += 0.2226147;
    x += { good: 0, mod: 0.3150652, poor: 0.8084096, vpoor: 0.9346919 }[o.lv || 'good'];
    if (o.mi) x += 0.1528943;
    x += { none: 0, mod: 0.1788899, sev: 0.3491475 }[o.ph || 'none'];
    x += { elective: 0, urgent: 0.3174673, emergency: 0.7039121, salvage: 1.362947 }[o.urg || 'elective'];
    x += { cabg: 0, single: 0.0062118, two: 0.5521478, three: 0.9724533 }[o.weight || 'cabg'];
    if (o.aorta) x += 0.6527205;
    return 100 * Math.exp(x) / (1 + Math.exp(x));
  }

  /* Mehran contrast-nephropathy score (2004), eGFR version */
  function mehran(o) {
    var s = (o.hypo ? 5 : 0) + (o.iabp ? 5 : 0) + (o.chf ? 5 : 0) + (o.age > 75 ? 4 : 0) + (o.anaemia ? 3 : 0) + (o.dm ? 3 : 0) +
      Math.floor((o.contrast || 0) / 100) + (o.egfr < 20 ? 6 : o.egfr < 40 ? 4 : o.egfr < 60 ? 2 : 0);
    var g = s <= 5 ? 0 : s <= 10 ? 1 : s <= 15 ? 2 : 3;
    return { score: s, grade: g, label: ['Low', 'Moderate', 'High', 'Very high'][g], cin: [7.5, 14.0, 26.1, 57.3][g], dialysis: [0.04, 0.12, 1.09, 12.6][g] };
  }

/* ===== Phase 3: heart failure, VTE, cardiomyopathy ===== */

  /* MAGGIC (Pocock 2013). Creatinine in µmol/L. Point tables and the mortality
     lookup both reproduce the MDCalc calculator exactly (51 patients, 24 Nov 2026). */
  var MAGGIC_MORT = [[1.5, 3.9], [1.6, 4.3], [1.8, 4.8], [2.0, 5.2], [2.2, 5.8], [2.4, 6.3], [2.7, 7.0], [2.9, 7.7], [3.2, 8.4], [3.6, 9.2],
    [3.9, 10.2], [4.3, 11.1], [4.8, 12.2], [5.2, 13.4], [5.8, 14.6], [6.3, 16.0], [7.0, 17.5], [7.7, 19.1], [8.4, 20.9], [9.3, 22.7],
    [10.2, 24.7], [11.1, 26.9], [12.2, 29.2], [13.4, 31.6], [14.7, 34.2], [16.0, 36.9], [17.5, 39.7], [19.1, 42.7], [20.9, 45.8], [22.7, 49.0],
    [24.8, 52.3], [26.9, 55.6], [29.2, 59.0], [31.6, 62.5], [34.2, 65.8], [36.9, 69.2], [39.8, 72.5], [42.7, 75.6], [45.8, 78.7], [49.0, 81.5],
    [52.3, 84.2], [55.7, 86.6], [59.1, 88.9], [62.5, 90.8], [65.9, 92.6], [69.2, 94.1], [72.5, 95.3], [75.7, 96.4], [78.7, 97.3], [81.6, 98.0], [84.2, 98.5]];
  function maggic(o) {
    var st = o.ef < 30 ? 0 : o.ef < 40 ? 1 : 2;
    var p = {
      ef: band(o.ef, [19, 24, 29, 34, 39], [7, 6, 5, 3, 2, 0]),
      age: band(o.age, [54, 59, 64, 69, 74, 79], [[0, 1, 2, 4, 6, 8, 10], [0, 2, 4, 6, 8, 10, 13], [0, 3, 5, 7, 9, 12, 15]][st]),
      sbp: band(o.sbp, [109, 119, 129, 139, 149], [[5, 4, 3, 2, 1, 0], [3, 2, 1, 1, 0, 0], [2, 1, 1, 0, 0, 0]][st]),
      bmi: band(o.bmi, [14, 19, 24, 29], [6, 5, 3, 2, 0]),
      cr: band(o.cr, [89, 109, 129, 149, 169, 209, 249], [0, 1, 2, 3, 4, 5, 6, 8]),
      nyha: [0, 0, 2, 6, 8][o.nyha || 1],
      other: (o.male ? 1 : 0) + (o.smoker ? 1 : 0) + (o.dm ? 3 : 0) + (o.copd ? 2 : 0) + (o.hf18 ? 2 : 0) + (o.noBB ? 3 : 0) + (o.noACE ? 1 : 0)
    };
    var s = p.ef + p.age + p.sbp + p.bmi + p.cr + p.nyha + p.other;
    var m = MAGGIC_MORT[Math.min(s, 50)];
    return { score: s, parts: p, y1: m[0], y3: m[1], capped: s > 50 };
  }

  /* Wells scores */
  function wellsPE(o) {
    var s = (o.dvtSigns ? 3 : 0) + (o.peLikely ? 3 : 0) + (o.hr > 100 ? 1.5 : 0) + (o.immob ? 1.5 : 0) + (o.priorVTE ? 1.5 : 0) + (o.haemoptysis ? 1 : 0) + (o.cancer ? 1 : 0);
    return { score: s, three: s < 2 ? 'Low' : s <= 6 ? 'Moderate' : 'High', rate3: s < 2 ? 1.3 : s <= 6 ? 16.2 : 40.6, two: s <= 4 ? 'PE unlikely' : 'PE likely' };
  }
  function wellsDVT(o) {
    var s = (o.cancer ? 1 : 0) + (o.paralysis ? 1 : 0) + (o.bedridden ? 1 : 0) + (o.tender ? 1 : 0) + (o.legSwollen ? 1 : 0) + (o.calf3 ? 1 : 0) +
      (o.pitting ? 1 : 0) + (o.collateral ? 1 : 0) + (o.priorDVT ? 1 : 0) - (o.altDx ? 2 : 0);
    return { score: s, three: s <= 0 ? 'Low' : s <= 2 ? 'Moderate' : 'High', rate3: s <= 0 ? 5 : s <= 2 ? 17 : 53, two: s < 2 ? 'DVT unlikely' : 'DVT likely' };
  }

  /* PESI and simplified PESI (Aujesky 2005; Jiménez 2010) */
  function pesi(o) {
    var s = o.age + (o.male ? 10 : 0) + (o.cancer ? 30 : 0) + (o.hf ? 10 : 0) + (o.lung ? 10 : 0) +
      (o.hr >= 110 ? 20 : 0) + (o.sbp < 100 ? 30 : 0) + (o.rr >= 30 ? 20 : 0) + (o.temp < 36 ? 20 : 0) + (o.altered ? 60 : 0) + (o.spo2 < 90 ? 20 : 0);
    var cl = s <= 65 ? 0 : s <= 85 ? 1 : s <= 105 ? 2 : s <= 125 ? 3 : 4;
    return { score: s, cls: cl, label: ['I', 'II', 'III', 'IV', 'V'][cl], rate: [1.6, 3.5, 7.1, 11.4, 24.5][cl] };
  }
  function spesi(o) {
    var items = [];
    if (o.age > 80) items.push('age > 80');
    if (o.cancer) items.push('cancer');
    if (o.cardioresp) items.push('chronic cardiopulmonary disease');
    if (o.hr >= 110) items.push('HR ≥ 110');
    if (o.sbp < 100) items.push('SBP < 100');
    if (o.spo2 < 90) items.push('SpO₂ < 90%');
    return { score: items.length, items: items, rate: items.length === 0 ? 1.0 : 10.9 };
  }

  return { crcl: crcl, bsa: bsa, friedewald: friedewald, sampson: sampson, map: map, doac: doac, smart2: smart2,
    crusade: crusade, tn01: tn01, TN: TN, precise: precise, euroscore: euroscore, mehran: mehran,
    maggic: maggic, wellsPE: wellsPE, wellsDVT: wellsDVT, pesi: pesi, spesi: spesi };
})();
if (typeof module !== 'undefined') module.exports = { RS: RS, UT: UT };
