pragma circom 2.1.7;

include "circomlib/circuits/comparators.circom";

template PatientPredicatesSelective() {
    // ---------- Private inputs ----------
    signal input age;
    signal input hivStatus;
    signal input hasAllergyToDrugX;

    // ---------- Public inputs ----------
    signal input nonce;
    signal input reqAdult;
    signal input reqHiv;
    signal input reqAllergy;

    // ---------- Public outputs ----------
    signal output outAdult;
    signal output outHiv;
    signal output outAllergy;

    // selectors are bits
    reqAdult * (reqAdult - 1) === 0;
    reqHiv * (reqHiv - 1) === 0;
    reqAllergy * (reqAllergy - 1) === 0;

    // ----- gated validity constraints (quadratic) -----
    // hivStatus is bit ONLY if reqHiv=1
    signal hivBitPoly;
    hivBitPoly <== hivStatus * (hivStatus - 1); // quadratic
    reqHiv * hivBitPoly === 0;                  // quadratic

    // hasAllergyToDrugX is bit ONLY if reqAllergy=1
    signal allergyBitPoly;
    allergyBitPoly <== hasAllergyToDrugX * (hasAllergyToDrugX - 1); // quadratic
    reqAllergy * allergyBitPoly === 0;                              // quadratic

    // ---------- Compute predicates ----------
    // Adult predicate: age >= 18
    component lt = LessThan(8);
    lt.in[0] <== age;
    lt.in[1] <== 18;
    signal isAdult;
    isAdult <== 1 - lt.out;

    // HIV negative
    signal isHivNegative;
    isHivNegative <== 1 - hivStatus;

    // No allergy
    signal noAllergy;
    noAllergy <== 1 - hasAllergyToDrugX;

    // ---------- Gate disclosure ----------
    outAdult <== reqAdult * isAdult;
    outHiv <== reqHiv * isHivNegative;
    outAllergy <== reqAllergy * noAllergy;

    // ---------- Enforce correctness only when requested ----------
    reqAdult * (outAdult - isAdult) === 0;
    reqHiv * (outHiv - isHivNegative) === 0;
    reqAllergy * (outAllergy - noAllergy) === 0;

    // ---------- Bind nonce explicitly ----------
    signal dummy;
    dummy <== nonce;
    dummy === nonce;
}

component main { public [nonce, reqAdult, reqHiv, reqAllergy] } = PatientPredicatesSelective();
