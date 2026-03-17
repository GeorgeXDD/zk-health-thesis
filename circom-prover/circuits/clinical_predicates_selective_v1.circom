pragma circom 2.1.7;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

template ClinicalPredicatesSelectiveV1() {
    // -------- Private Inputs --------
    signal input hivStatus;
    signal input hepBStatus;
    signal input hepCStatus;
    signal input covidStatus;
    signal input pregnancyStatus;
    signal input hba1cX100;
    signal input totalCholesterolX10;
    signal input ldlX10;
    signal input fastingGlucoseX10;
    signal input triglyceridesX10;

    // -------- Public Inputs --------
    signal input nonce;
    signal input reqHiv;
    signal input reqHepB;
    signal input reqHepC;
    signal input reqCovid;
    signal input reqPreg;
    signal input reqA1c;
    signal input reqTotalChol;
    signal input reqLdl;
    signal input reqFastingGlucose;
    signal input reqTriglycerides;

    // -------- Public Outputs --------
    signal output outHiv;
    signal output outHepB;
    signal output outHepC;
    signal output outCovid;
    signal output outPreg;
    signal output outA1cOk;
    signal output outTotalCholOk;
    signal output outLdlOk;
    signal output outFastingGlucoseOk;
    signal output outTriglyceridesOk;

    reqHiv * (reqHiv - 1) === 0;
    reqHepB * (reqHepB - 1) === 0;
    reqHepC * (reqHepC - 1) === 0;
    reqCovid * (reqCovid - 1) === 0;
    reqPreg * (reqPreg - 1) === 0;
    reqA1c * (reqA1c - 1) === 0;
    reqTotalChol * (reqTotalChol - 1) === 0;
    reqLdl * (reqLdl - 1) === 0;
    reqFastingGlucose * (reqFastingGlucose - 1) === 0;
    reqTriglycerides * (reqTriglycerides - 1) === 0;

    hivStatus * (hivStatus - 1) === 0;
    signal isHivNegative;
    isHivNegative <== 1 - hivStatus;
    outHiv <== reqHiv * isHivNegative;
    reqHiv * (outHiv - isHivNegative) === 0;

    hepBStatus * (hepBStatus - 1) === 0;
    signal isHepBNegative;
    isHepBNegative <== 1 - hepBStatus;
    outHepB <== reqHepB * isHepBNegative;
    reqHepB * (outHepB - isHepBNegative) === 0;

    hepCStatus * (hepCStatus - 1) === 0;
    signal isHepCNegative;
    isHepCNegative <== 1 - hepCStatus;
    outHepC <== reqHepC * isHepCNegative;
    reqHepC * (outHepC - isHepCNegative) === 0;

    covidStatus * (covidStatus - 1) === 0;
    signal isCovidNegative;
    isCovidNegative <== 1 - covidStatus;
    outCovid <== reqCovid * isCovidNegative;
    reqCovid * (outCovid - isCovidNegative) === 0;

    pregnancyStatus * (pregnancyStatus - 1) === 0;
    signal isPregNegative;
    isPregNegative <== 1 - pregnancyStatus;
    outPreg <== reqPreg * isPregNegative;
    reqPreg * (outPreg - isPregNegative) === 0;

    component a1cBits = Num2Bits(16);
    a1cBits.in <== hba1cX100;

    component ltA1c = LessThan(16);
    ltA1c.in[0] <== hba1cX100;
    ltA1c.in[1] <== 650;

    signal isA1cOk;
    isA1cOk <== ltA1c.out;

    outA1cOk <== reqA1c * isA1cOk;
    reqA1c * (outA1cOk - isA1cOk) === 0;

    component totalCholBits = Num2Bits(16);
    totalCholBits.in <== totalCholesterolX10;

    component ltTotalChol = LessThan(16);
    ltTotalChol.in[0] <== totalCholesterolX10;
    ltTotalChol.in[1] <== 2000;

    signal isTotalCholOk;
    isTotalCholOk <== ltTotalChol.out;

    outTotalCholOk <== reqTotalChol * isTotalCholOk;
    reqTotalChol * (outTotalCholOk - isTotalCholOk) === 0;

    component ldlBits = Num2Bits(16);
    ldlBits.in <== ldlX10;

    component ltLdl = LessThan(16);
    ltLdl.in[0] <== ldlX10;
    ltLdl.in[1] <== 1300;

    signal isLdlOk;
    isLdlOk <== ltLdl.out;

    outLdlOk <== reqLdl * isLdlOk;
    reqLdl * (outLdlOk - isLdlOk) === 0;

    component fastingGlucoseBits = Num2Bits(16);
    fastingGlucoseBits.in <== fastingGlucoseX10;

    component ltFastingGlucose = LessThan(16);
    ltFastingGlucose.in[0] <== fastingGlucoseX10;
    ltFastingGlucose.in[1] <== 1000;

    signal isFastingGlucoseOk;
    isFastingGlucoseOk <== ltFastingGlucose.out;

    outFastingGlucoseOk <== reqFastingGlucose * isFastingGlucoseOk;
    reqFastingGlucose * (outFastingGlucoseOk - isFastingGlucoseOk) === 0;

    component triglyceridesBits = Num2Bits(16);
    triglyceridesBits.in <== triglyceridesX10;

    component ltTriglycerides = LessThan(16);
    ltTriglycerides.in[0] <== triglyceridesX10;
    ltTriglycerides.in[1] <== 1500;

    signal isTriglyceridesOk;
    isTriglyceridesOk <== ltTriglycerides.out;

    outTriglyceridesOk <== reqTriglycerides * isTriglyceridesOk;
    reqTriglycerides * (outTriglyceridesOk - isTriglyceridesOk) === 0;

    signal dummy;
    dummy <== nonce * 1;
}

component main { public [nonce, reqHiv, reqHepB, reqHepC, reqCovid, reqPreg, reqA1c, reqTotalChol, reqLdl, reqFastingGlucose, reqTriglycerides] } = ClinicalPredicatesSelectiveV1();
