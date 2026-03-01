pragma circom 2.1.7;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

// Selective disclosure circuit for two predicates:
//  - HIV_NEGATIVE (categorical): hivStatus bit, negative means 0
//  - HBA1C_LT_6_5 (numeric): hba1cX100 < 650, using fixed-point (value * 100)
//
// Private inputs:
//  - hivStatus: 0 (negative) or 1 (positive)
//  - hba1cX100: integer, HbA1c percent * 100 (e.g., 5.8% -> 580)
//
// Public inputs:
//  - nonce
//  - reqHiv (0/1)
//  - reqA1c (0/1)
//
// Public outputs:
//  - outHiv (0/1)
//  - outA1cOk (0/1)

template PatientPredicatesHivA1cSelective() {
    // -------- Private Inputs --------
    signal input hivStatus;
    signal input hba1cX100;

    // -------- Public Inputs --------
    signal input nonce;
    signal input reqHiv;
    signal input reqA1c;

    // -------- Public Outputs --------
    signal output outHiv;
    signal output outA1cOk;

    // req bits must be bits
    reqHiv * (reqHiv - 1) === 0;
    reqA1c * (reqA1c - 1) === 0;

    // ---- HIV predicate ----
    // hivStatus must be a bit
    hivStatus * (hivStatus - 1) === 0;

    // isHivNegative = 1 - hivStatus
    signal isHivNegative;
    isHivNegative <== 1 - hivStatus;

    // selective disclosure
    outHiv <== reqHiv * isHivNegative;
    // enforce only if requested
    reqHiv * (outHiv - isHivNegative) === 0;

    // ---- HbA1c predicate ----
    // range-check hba1cX100 fits 16 bits (0..65535)
    component a1cBits = Num2Bits(16);
    a1cBits.in <== hba1cX100;

    // isA1cOk = (hba1cX100 < 650)
    component ltA1c = LessThan(16);
    ltA1c.in[0] <== hba1cX100;
    ltA1c.in[1] <== 650;

    signal isA1cOk;
    isA1cOk <== ltA1c.out;

    outA1cOk <== reqA1c * isA1cOk;
    reqA1c * (outA1cOk - isA1cOk) === 0;

    // bind nonce into witness
    signal dummy;
    dummy <== nonce * 1;
}

component main { public [nonce, reqHiv, reqA1c] } = PatientPredicatesHivA1cSelective();
