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
    signal input hdlX10;
    signal input systolicBpX10;
    signal input diastolicBpX10;
    signal input bmiX10;
    signal input creatinineX10;

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
    signal input reqHdl;
    signal input reqSystolicBp;
    signal input reqDiastolicBp;
    signal input reqBmi;
    signal input reqCreatinine;

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
    signal output outHdlOk;
    signal output outSystolicBpOk;
    signal output outDiastolicBpOk;
    signal output outBmiOk;
    signal output outCreatinineOk;

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
    reqHdl * (reqHdl - 1) === 0;
    reqSystolicBp * (reqSystolicBp - 1) === 0;
    reqDiastolicBp * (reqDiastolicBp - 1) === 0;
    reqBmi * (reqBmi - 1) === 0;
    reqCreatinine * (reqCreatinine - 1) === 0;

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

    component hdlBits = Num2Bits(16);
    hdlBits.in <== hdlX10;

    // HDL_GT_40 means hdlX10 > 400
    component gtHdl = LessThan(16);
    gtHdl.in[0] <== 400;
    gtHdl.in[1] <== hdlX10;

    signal isHdlOk;
    isHdlOk <== gtHdl.out;

    outHdlOk <== reqHdl * isHdlOk;
    reqHdl * (outHdlOk - isHdlOk) === 0;

    component systolicBits = Num2Bits(16);
    systolicBits.in <== systolicBpX10;

    component ltSystolic = LessThan(16);
    ltSystolic.in[0] <== systolicBpX10;
    ltSystolic.in[1] <== 1300;

    signal isSystolicBpOk;
    isSystolicBpOk <== ltSystolic.out;

    outSystolicBpOk <== reqSystolicBp * isSystolicBpOk;
    reqSystolicBp * (outSystolicBpOk - isSystolicBpOk) === 0;

    component diastolicBits = Num2Bits(16);
    diastolicBits.in <== diastolicBpX10;

    component ltDiastolic = LessThan(16);
    ltDiastolic.in[0] <== diastolicBpX10;
    ltDiastolic.in[1] <== 800;

    signal isDiastolicBpOk;
    isDiastolicBpOk <== ltDiastolic.out;

    outDiastolicBpOk <== reqDiastolicBp * isDiastolicBpOk;
    reqDiastolicBp * (outDiastolicBpOk - isDiastolicBpOk) === 0;

    component bmiBits = Num2Bits(16);
    bmiBits.in <== bmiX10;

    component ltBmi = LessThan(16);
    ltBmi.in[0] <== bmiX10;
    ltBmi.in[1] <== 300;

    signal isBmiOk;
    isBmiOk <== ltBmi.out;

    outBmiOk <== reqBmi * isBmiOk;
    reqBmi * (outBmiOk - isBmiOk) === 0;

    component creatinineBits = Num2Bits(16);
    creatinineBits.in <== creatinineX10;

    component ltCreatinine = LessThan(16);
    ltCreatinine.in[0] <== creatinineX10;
    ltCreatinine.in[1] <== 13;

    signal isCreatinineOk;
    isCreatinineOk <== ltCreatinine.out;

    outCreatinineOk <== reqCreatinine * isCreatinineOk;
    reqCreatinine * (outCreatinineOk - isCreatinineOk) === 0;

    signal dummy;
    dummy <== nonce * 1;
}

component main { public [nonce, reqHiv, reqHepB, reqHepC, reqCovid, reqPreg, reqA1c, reqTotalChol, reqLdl, reqFastingGlucose, reqTriglycerides, reqHdl, reqSystolicBp, reqDiastolicBp, reqBmi, reqCreatinine] } = ClinicalPredicatesSelectiveV1();
