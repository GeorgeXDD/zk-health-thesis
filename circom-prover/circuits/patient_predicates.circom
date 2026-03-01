pragma circom 2.1.7;

include "circomlib/circuits/comparators.circom";

// Private: age, hivStatus, hasAllergyToDrugX
// Public: nonce
// Outputs: isAdult, isHIVNegative, noAllergyToDrugX
template PatientPredicates() {
    signal input age;
    signal input hivStatus;
    signal input hasAllergyToDrugX;

    signal input nonce; // public

    signal output isAdult;
    signal output isHIVNegative;
    signal output noAllergyToDrugX;

    component lt = LessThan(8);
    lt.in[0] <== age;
    lt.in[1] <== 18;
    isAdult <== 1 - lt.out;

    hivStatus * (hivStatus - 1) === 0;
    isHIVNegative <== 1 - hivStatus;

    hasAllergyToDrugX * (hasAllergyToDrugX - 1) === 0;
    noAllergyToDrugX <== 1 - hasAllergyToDrugX;

    // bind nonce in constraints
    signal dummy;
    dummy <== nonce * 1;
}

component main { public [nonce] } = PatientPredicates();
