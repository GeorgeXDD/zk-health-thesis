pragma circom 2.1.7;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

template ClinicalPredicatesSelectiveV1() {
    signal input values[100];
    signal input nonce;
    signal input reqs[100];

    signal output outs[100];

    for (var i = 0; i < 100; i++) {
        reqs[i] * (reqs[i] - 1) === 0;
    }

    // HIV_NEGATIVE
    values[0] * (values[0] - 1) === 0;
    signal isOk0;
    isOk0 <== 1 - values[0];
    outs[0] <== reqs[0] * isOk0;
    reqs[0] * (outs[0] - isOk0) === 0;

    // HEPB_NEGATIVE
    values[1] * (values[1] - 1) === 0;
    signal isOk1;
    isOk1 <== 1 - values[1];
    outs[1] <== reqs[1] * isOk1;
    reqs[1] * (outs[1] - isOk1) === 0;

    // HEPC_NEGATIVE
    values[2] * (values[2] - 1) === 0;
    signal isOk2;
    isOk2 <== 1 - values[2];
    outs[2] <== reqs[2] * isOk2;
    reqs[2] * (outs[2] - isOk2) === 0;

    // COVID_NEGATIVE
    values[3] * (values[3] - 1) === 0;
    signal isOk3;
    isOk3 <== 1 - values[3];
    outs[3] <== reqs[3] * isOk3;
    reqs[3] * (outs[3] - isOk3) === 0;

    // PREGNANCY_NEGATIVE
    values[4] * (values[4] - 1) === 0;
    signal isOk4;
    isOk4 <== 1 - values[4];
    outs[4] <== reqs[4] * isOk4;
    reqs[4] * (outs[4] - isOk4) === 0;

    // HBA1C_LT_6_5
    component bits5 = Num2Bits(32);
    bits5.in <== values[5];
    component cmp5 = LessThan(32);
    cmp5.in[0] <== values[5];
    cmp5.in[1] <== 650;
    signal isOk5;
    isOk5 <== cmp5.out;
    outs[5] <== reqs[5] * isOk5;
    reqs[5] * (outs[5] - isOk5) === 0;

    // TOTAL_CHOLESTEROL_LT_200
    component bits6 = Num2Bits(32);
    bits6.in <== values[6];
    component cmp6 = LessThan(32);
    cmp6.in[0] <== values[6];
    cmp6.in[1] <== 2000;
    signal isOk6;
    isOk6 <== cmp6.out;
    outs[6] <== reqs[6] * isOk6;
    reqs[6] * (outs[6] - isOk6) === 0;

    // LDL_LT_130
    component bits7 = Num2Bits(32);
    bits7.in <== values[7];
    component cmp7 = LessThan(32);
    cmp7.in[0] <== values[7];
    cmp7.in[1] <== 1300;
    signal isOk7;
    isOk7 <== cmp7.out;
    outs[7] <== reqs[7] * isOk7;
    reqs[7] * (outs[7] - isOk7) === 0;

    // FASTING_GLUCOSE_LT_100
    component bits8 = Num2Bits(32);
    bits8.in <== values[8];
    component cmp8 = LessThan(32);
    cmp8.in[0] <== values[8];
    cmp8.in[1] <== 1000;
    signal isOk8;
    isOk8 <== cmp8.out;
    outs[8] <== reqs[8] * isOk8;
    reqs[8] * (outs[8] - isOk8) === 0;

    // TRIGLYCERIDES_LT_150
    component bits9 = Num2Bits(32);
    bits9.in <== values[9];
    component cmp9 = LessThan(32);
    cmp9.in[0] <== values[9];
    cmp9.in[1] <== 1500;
    signal isOk9;
    isOk9 <== cmp9.out;
    outs[9] <== reqs[9] * isOk9;
    reqs[9] * (outs[9] - isOk9) === 0;

    // HDL_GT_40
    component bits10 = Num2Bits(32);
    bits10.in <== values[10];
    component cmp10 = LessThan(32);
    cmp10.in[0] <== 400;
    cmp10.in[1] <== values[10];
    signal isOk10;
    isOk10 <== cmp10.out;
    outs[10] <== reqs[10] * isOk10;
    reqs[10] * (outs[10] - isOk10) === 0;

    // SYSTOLIC_BP_LT_130
    component bits11 = Num2Bits(32);
    bits11.in <== values[11];
    component cmp11 = LessThan(32);
    cmp11.in[0] <== values[11];
    cmp11.in[1] <== 1300;
    signal isOk11;
    isOk11 <== cmp11.out;
    outs[11] <== reqs[11] * isOk11;
    reqs[11] * (outs[11] - isOk11) === 0;

    // DIASTOLIC_BP_LT_80
    component bits12 = Num2Bits(32);
    bits12.in <== values[12];
    component cmp12 = LessThan(32);
    cmp12.in[0] <== values[12];
    cmp12.in[1] <== 800;
    signal isOk12;
    isOk12 <== cmp12.out;
    outs[12] <== reqs[12] * isOk12;
    reqs[12] * (outs[12] - isOk12) === 0;

    // BMI_LT_30
    component bits13 = Num2Bits(32);
    bits13.in <== values[13];
    component cmp13 = LessThan(32);
    cmp13.in[0] <== values[13];
    cmp13.in[1] <== 300;
    signal isOk13;
    isOk13 <== cmp13.out;
    outs[13] <== reqs[13] * isOk13;
    reqs[13] * (outs[13] - isOk13) === 0;

    // CREATININE_LT_1_3
    component bits14 = Num2Bits(32);
    bits14.in <== values[14];
    component cmp14 = LessThan(32);
    cmp14.in[0] <== values[14];
    cmp14.in[1] <== 13;
    signal isOk14;
    isOk14 <== cmp14.out;
    outs[14] <== reqs[14] * isOk14;
    reqs[14] * (outs[14] - isOk14) === 0;

    // SYPHILIS_NEGATIVE
    values[15] * (values[15] - 1) === 0;
    signal isOk15;
    isOk15 <== 1 - values[15];
    outs[15] <== reqs[15] * isOk15;
    reqs[15] * (outs[15] - isOk15) === 0;

    // GONORRHEA_NEGATIVE
    values[16] * (values[16] - 1) === 0;
    signal isOk16;
    isOk16 <== 1 - values[16];
    outs[16] <== reqs[16] * isOk16;
    reqs[16] * (outs[16] - isOk16) === 0;

    // CHLAMYDIA_NEGATIVE
    values[17] * (values[17] - 1) === 0;
    signal isOk17;
    isOk17 <== 1 - values[17];
    outs[17] <== reqs[17] * isOk17;
    reqs[17] * (outs[17] - isOk17) === 0;

    // HSV1_NEGATIVE
    values[18] * (values[18] - 1) === 0;
    signal isOk18;
    isOk18 <== 1 - values[18];
    outs[18] <== reqs[18] * isOk18;
    reqs[18] * (outs[18] - isOk18) === 0;

    // HSV2_NEGATIVE
    values[19] * (values[19] - 1) === 0;
    signal isOk19;
    isOk19 <== 1 - values[19];
    outs[19] <== reqs[19] * isOk19;
    reqs[19] * (outs[19] - isOk19) === 0;

    // HPV_NEGATIVE
    values[20] * (values[20] - 1) === 0;
    signal isOk20;
    isOk20 <== 1 - values[20];
    outs[20] <== reqs[20] * isOk20;
    reqs[20] * (outs[20] - isOk20) === 0;

    // INFLUENZA_A_NEGATIVE
    values[21] * (values[21] - 1) === 0;
    signal isOk21;
    isOk21 <== 1 - values[21];
    outs[21] <== reqs[21] * isOk21;
    reqs[21] * (outs[21] - isOk21) === 0;

    // INFLUENZA_B_NEGATIVE
    values[22] * (values[22] - 1) === 0;
    signal isOk22;
    isOk22 <== 1 - values[22];
    outs[22] <== reqs[22] * isOk22;
    reqs[22] * (outs[22] - isOk22) === 0;

    // RSV_NEGATIVE
    values[23] * (values[23] - 1) === 0;
    signal isOk23;
    isOk23 <== 1 - values[23];
    outs[23] <== reqs[23] * isOk23;
    reqs[23] * (outs[23] - isOk23) === 0;

    // TUBERCULOSIS_NEGATIVE
    values[24] * (values[24] - 1) === 0;
    signal isOk24;
    isOk24 <== 1 - values[24];
    outs[24] <== reqs[24] * isOk24;
    reqs[24] * (outs[24] - isOk24) === 0;

    // EBV_NEGATIVE
    values[25] * (values[25] - 1) === 0;
    signal isOk25;
    isOk25 <== 1 - values[25];
    outs[25] <== reqs[25] * isOk25;
    reqs[25] * (outs[25] - isOk25) === 0;

    // CMV_NEGATIVE
    values[26] * (values[26] - 1) === 0;
    signal isOk26;
    isOk26 <== 1 - values[26];
    outs[26] <== reqs[26] * isOk26;
    reqs[26] * (outs[26] - isOk26) === 0;

    // RUBELLA_IGM_NEGATIVE
    values[27] * (values[27] - 1) === 0;
    signal isOk27;
    isOk27 <== 1 - values[27];
    outs[27] <== reqs[27] * isOk27;
    reqs[27] * (outs[27] - isOk27) === 0;

    // TOXOPLASMA_IGM_NEGATIVE
    values[28] * (values[28] - 1) === 0;
    signal isOk28;
    isOk28 <== 1 - values[28];
    outs[28] <== reqs[28] * isOk28;
    reqs[28] * (outs[28] - isOk28) === 0;

    // H_PYLORI_NEGATIVE
    values[29] * (values[29] - 1) === 0;
    signal isOk29;
    isOk29 <== 1 - values[29];
    outs[29] <== reqs[29] * isOk29;
    reqs[29] * (outs[29] - isOk29) === 0;

    // GLUCOSE_RANDOM_LT_140
    component bits30 = Num2Bits(32);
    bits30.in <== values[30];
    component cmp30 = LessThan(32);
    cmp30.in[0] <== values[30];
    cmp30.in[1] <== 1400;
    signal isOk30;
    isOk30 <== cmp30.out;
    outs[30] <== reqs[30] * isOk30;
    reqs[30] * (outs[30] - isOk30) === 0;

    // GLUCOSE_RANDOM_LT_200
    component bits31 = Num2Bits(32);
    bits31.in <== values[31];
    component cmp31 = LessThan(32);
    cmp31.in[0] <== values[31];
    cmp31.in[1] <== 2000;
    signal isOk31;
    isOk31 <== cmp31.out;
    outs[31] <== reqs[31] * isOk31;
    reqs[31] * (outs[31] - isOk31) === 0;

    // HBA1C_LT_5_7
    component bits32 = Num2Bits(32);
    bits32.in <== values[32];
    component cmp32 = LessThan(32);
    cmp32.in[0] <== values[32];
    cmp32.in[1] <== 570;
    signal isOk32;
    isOk32 <== cmp32.out;
    outs[32] <== reqs[32] * isOk32;
    reqs[32] * (outs[32] - isOk32) === 0;

    // HBA1C_LT_8_0
    component bits33 = Num2Bits(32);
    bits33.in <== values[33];
    component cmp33 = LessThan(32);
    cmp33.in[0] <== values[33];
    cmp33.in[1] <== 800;
    signal isOk33;
    isOk33 <== cmp33.out;
    outs[33] <== reqs[33] * isOk33;
    reqs[33] * (outs[33] - isOk33) === 0;

    // INSULIN_FASTING_LT_25
    component bits34 = Num2Bits(32);
    bits34.in <== values[34];
    component cmp34 = LessThan(32);
    cmp34.in[0] <== values[34];
    cmp34.in[1] <== 250;
    signal isOk34;
    isOk34 <== cmp34.out;
    outs[34] <== reqs[34] * isOk34;
    reqs[34] * (outs[34] - isOk34) === 0;

    // UREA_LT_50
    component bits35 = Num2Bits(32);
    bits35.in <== values[35];
    component cmp35 = LessThan(32);
    cmp35.in[0] <== values[35];
    cmp35.in[1] <== 500;
    signal isOk35;
    isOk35 <== cmp35.out;
    outs[35] <== reqs[35] * isOk35;
    reqs[35] * (outs[35] - isOk35) === 0;

    // BUN_LT_20
    component bits36 = Num2Bits(32);
    bits36.in <== values[36];
    component cmp36 = LessThan(32);
    cmp36.in[0] <== values[36];
    cmp36.in[1] <== 200;
    signal isOk36;
    isOk36 <== cmp36.out;
    outs[36] <== reqs[36] * isOk36;
    reqs[36] * (outs[36] - isOk36) === 0;

    // EGFR_GT_60
    component bits37 = Num2Bits(32);
    bits37.in <== values[37];
    component cmp37 = LessThan(32);
    cmp37.in[0] <== 600;
    cmp37.in[1] <== values[37];
    signal isOk37;
    isOk37 <== cmp37.out;
    outs[37] <== reqs[37] * isOk37;
    reqs[37] * (outs[37] - isOk37) === 0;

    // URIC_ACID_LT_7_0
    component bits38 = Num2Bits(32);
    bits38.in <== values[38];
    component cmp38 = LessThan(32);
    cmp38.in[0] <== values[38];
    cmp38.in[1] <== 70;
    signal isOk38;
    isOk38 <== cmp38.out;
    outs[38] <== reqs[38] * isOk38;
    reqs[38] * (outs[38] - isOk38) === 0;

    // MICROALBUMIN_LT_30
    component bits39 = Num2Bits(32);
    bits39.in <== values[39];
    component cmp39 = LessThan(32);
    cmp39.in[0] <== values[39];
    cmp39.in[1] <== 300;
    signal isOk39;
    isOk39 <== cmp39.out;
    outs[39] <== reqs[39] * isOk39;
    reqs[39] * (outs[39] - isOk39) === 0;

    // AST_LT_40
    component bits40 = Num2Bits(32);
    bits40.in <== values[40];
    component cmp40 = LessThan(32);
    cmp40.in[0] <== values[40];
    cmp40.in[1] <== 400;
    signal isOk40;
    isOk40 <== cmp40.out;
    outs[40] <== reqs[40] * isOk40;
    reqs[40] * (outs[40] - isOk40) === 0;

    // ALT_LT_40
    component bits41 = Num2Bits(32);
    bits41.in <== values[41];
    component cmp41 = LessThan(32);
    cmp41.in[0] <== values[41];
    cmp41.in[1] <== 400;
    signal isOk41;
    isOk41 <== cmp41.out;
    outs[41] <== reqs[41] * isOk41;
    reqs[41] * (outs[41] - isOk41) === 0;

    // ALP_LT_120
    component bits42 = Num2Bits(32);
    bits42.in <== values[42];
    component cmp42 = LessThan(32);
    cmp42.in[0] <== values[42];
    cmp42.in[1] <== 1200;
    signal isOk42;
    isOk42 <== cmp42.out;
    outs[42] <== reqs[42] * isOk42;
    reqs[42] * (outs[42] - isOk42) === 0;

    // GGT_LT_60
    component bits43 = Num2Bits(32);
    bits43.in <== values[43];
    component cmp43 = LessThan(32);
    cmp43.in[0] <== values[43];
    cmp43.in[1] <== 600;
    signal isOk43;
    isOk43 <== cmp43.out;
    outs[43] <== reqs[43] * isOk43;
    reqs[43] * (outs[43] - isOk43) === 0;

    // TOTAL_BILIRUBIN_LT_1_2
    component bits44 = Num2Bits(32);
    bits44.in <== values[44];
    component cmp44 = LessThan(32);
    cmp44.in[0] <== values[44];
    cmp44.in[1] <== 12;
    signal isOk44;
    isOk44 <== cmp44.out;
    outs[44] <== reqs[44] * isOk44;
    reqs[44] * (outs[44] - isOk44) === 0;

    // DIRECT_BILIRUBIN_LT_0_3
    component bits45 = Num2Bits(32);
    bits45.in <== values[45];
    component cmp45 = LessThan(32);
    cmp45.in[0] <== values[45];
    cmp45.in[1] <== 3;
    signal isOk45;
    isOk45 <== cmp45.out;
    outs[45] <== reqs[45] * isOk45;
    reqs[45] * (outs[45] - isOk45) === 0;

    // ALBUMIN_GT_3_5
    component bits46 = Num2Bits(32);
    bits46.in <== values[46];
    component cmp46 = LessThan(32);
    cmp46.in[0] <== 35;
    cmp46.in[1] <== values[46];
    signal isOk46;
    isOk46 <== cmp46.out;
    outs[46] <== reqs[46] * isOk46;
    reqs[46] * (outs[46] - isOk46) === 0;

    // TOTAL_PROTEIN_GT_6_0
    component bits47 = Num2Bits(32);
    bits47.in <== values[47];
    component cmp47 = LessThan(32);
    cmp47.in[0] <== 60;
    cmp47.in[1] <== values[47];
    signal isOk47;
    isOk47 <== cmp47.out;
    outs[47] <== reqs[47] * isOk47;
    reqs[47] * (outs[47] - isOk47) === 0;

    // AMMONIA_LT_50
    component bits48 = Num2Bits(32);
    bits48.in <== values[48];
    component cmp48 = LessThan(32);
    cmp48.in[0] <== values[48];
    cmp48.in[1] <== 500;
    signal isOk48;
    isOk48 <== cmp48.out;
    outs[48] <== reqs[48] * isOk48;
    reqs[48] * (outs[48] - isOk48) === 0;

    // LDH_LT_250
    component bits49 = Num2Bits(32);
    bits49.in <== values[49];
    component cmp49 = LessThan(32);
    cmp49.in[0] <== values[49];
    cmp49.in[1] <== 2500;
    signal isOk49;
    isOk49 <== cmp49.out;
    outs[49] <== reqs[49] * isOk49;
    reqs[49] * (outs[49] - isOk49) === 0;

    // SODIUM_GT_135
    component bits50 = Num2Bits(32);
    bits50.in <== values[50];
    component cmp50 = LessThan(32);
    cmp50.in[0] <== 1350;
    cmp50.in[1] <== values[50];
    signal isOk50;
    isOk50 <== cmp50.out;
    outs[50] <== reqs[50] * isOk50;
    reqs[50] * (outs[50] - isOk50) === 0;

    // SODIUM_LT_145
    component bits51 = Num2Bits(32);
    bits51.in <== values[51];
    component cmp51 = LessThan(32);
    cmp51.in[0] <== values[51];
    cmp51.in[1] <== 1450;
    signal isOk51;
    isOk51 <== cmp51.out;
    outs[51] <== reqs[51] * isOk51;
    reqs[51] * (outs[51] - isOk51) === 0;

    // POTASSIUM_GT_3_5
    component bits52 = Num2Bits(32);
    bits52.in <== values[52];
    component cmp52 = LessThan(32);
    cmp52.in[0] <== 35;
    cmp52.in[1] <== values[52];
    signal isOk52;
    isOk52 <== cmp52.out;
    outs[52] <== reqs[52] * isOk52;
    reqs[52] * (outs[52] - isOk52) === 0;

    // POTASSIUM_LT_5_1
    component bits53 = Num2Bits(32);
    bits53.in <== values[53];
    component cmp53 = LessThan(32);
    cmp53.in[0] <== values[53];
    cmp53.in[1] <== 51;
    signal isOk53;
    isOk53 <== cmp53.out;
    outs[53] <== reqs[53] * isOk53;
    reqs[53] * (outs[53] - isOk53) === 0;

    // CHLORIDE_GT_98
    component bits54 = Num2Bits(32);
    bits54.in <== values[54];
    component cmp54 = LessThan(32);
    cmp54.in[0] <== 980;
    cmp54.in[1] <== values[54];
    signal isOk54;
    isOk54 <== cmp54.out;
    outs[54] <== reqs[54] * isOk54;
    reqs[54] * (outs[54] - isOk54) === 0;

    // CHLORIDE_LT_107
    component bits55 = Num2Bits(32);
    bits55.in <== values[55];
    component cmp55 = LessThan(32);
    cmp55.in[0] <== values[55];
    cmp55.in[1] <== 1070;
    signal isOk55;
    isOk55 <== cmp55.out;
    outs[55] <== reqs[55] * isOk55;
    reqs[55] * (outs[55] - isOk55) === 0;

    // CALCIUM_GT_8_5
    component bits56 = Num2Bits(32);
    bits56.in <== values[56];
    component cmp56 = LessThan(32);
    cmp56.in[0] <== 85;
    cmp56.in[1] <== values[56];
    signal isOk56;
    isOk56 <== cmp56.out;
    outs[56] <== reqs[56] * isOk56;
    reqs[56] * (outs[56] - isOk56) === 0;

    // CALCIUM_LT_10_5
    component bits57 = Num2Bits(32);
    bits57.in <== values[57];
    component cmp57 = LessThan(32);
    cmp57.in[0] <== values[57];
    cmp57.in[1] <== 105;
    signal isOk57;
    isOk57 <== cmp57.out;
    outs[57] <== reqs[57] * isOk57;
    reqs[57] * (outs[57] - isOk57) === 0;

    // MAGNESIUM_GT_1_7
    component bits58 = Num2Bits(32);
    bits58.in <== values[58];
    component cmp58 = LessThan(32);
    cmp58.in[0] <== 17;
    cmp58.in[1] <== values[58];
    signal isOk58;
    isOk58 <== cmp58.out;
    outs[58] <== reqs[58] * isOk58;
    reqs[58] * (outs[58] - isOk58) === 0;

    // MAGNESIUM_LT_2_4
    component bits59 = Num2Bits(32);
    bits59.in <== values[59];
    component cmp59 = LessThan(32);
    cmp59.in[0] <== values[59];
    cmp59.in[1] <== 24;
    signal isOk59;
    isOk59 <== cmp59.out;
    outs[59] <== reqs[59] * isOk59;
    reqs[59] * (outs[59] - isOk59) === 0;

    // PHOSPHATE_GT_2_5
    component bits60 = Num2Bits(32);
    bits60.in <== values[60];
    component cmp60 = LessThan(32);
    cmp60.in[0] <== 25;
    cmp60.in[1] <== values[60];
    signal isOk60;
    isOk60 <== cmp60.out;
    outs[60] <== reqs[60] * isOk60;
    reqs[60] * (outs[60] - isOk60) === 0;

    // PHOSPHATE_LT_4_5
    component bits61 = Num2Bits(32);
    bits61.in <== values[61];
    component cmp61 = LessThan(32);
    cmp61.in[0] <== values[61];
    cmp61.in[1] <== 45;
    signal isOk61;
    isOk61 <== cmp61.out;
    outs[61] <== reqs[61] * isOk61;
    reqs[61] * (outs[61] - isOk61) === 0;

    // BICARBONATE_GT_22
    component bits62 = Num2Bits(32);
    bits62.in <== values[62];
    component cmp62 = LessThan(32);
    cmp62.in[0] <== 220;
    cmp62.in[1] <== values[62];
    signal isOk62;
    isOk62 <== cmp62.out;
    outs[62] <== reqs[62] * isOk62;
    reqs[62] * (outs[62] - isOk62) === 0;

    // BICARBONATE_LT_29
    component bits63 = Num2Bits(32);
    bits63.in <== values[63];
    component cmp63 = LessThan(32);
    cmp63.in[0] <== values[63];
    cmp63.in[1] <== 290;
    signal isOk63;
    isOk63 <== cmp63.out;
    outs[63] <== reqs[63] * isOk63;
    reqs[63] * (outs[63] - isOk63) === 0;

    // ANION_GAP_LT_16
    component bits64 = Num2Bits(32);
    bits64.in <== values[64];
    component cmp64 = LessThan(32);
    cmp64.in[0] <== values[64];
    cmp64.in[1] <== 160;
    signal isOk64;
    isOk64 <== cmp64.out;
    outs[64] <== reqs[64] * isOk64;
    reqs[64] * (outs[64] - isOk64) === 0;

    // NON_HDL_LT_160
    component bits65 = Num2Bits(32);
    bits65.in <== values[65];
    component cmp65 = LessThan(32);
    cmp65.in[0] <== values[65];
    cmp65.in[1] <== 1600;
    signal isOk65;
    isOk65 <== cmp65.out;
    outs[65] <== reqs[65] * isOk65;
    reqs[65] * (outs[65] - isOk65) === 0;

    // NON_HDL_LT_130
    component bits66 = Num2Bits(32);
    bits66.in <== values[66];
    component cmp66 = LessThan(32);
    cmp66.in[0] <== values[66];
    cmp66.in[1] <== 1300;
    signal isOk66;
    isOk66 <== cmp66.out;
    outs[66] <== reqs[66] * isOk66;
    reqs[66] * (outs[66] - isOk66) === 0;

    // TOTAL_TO_HDL_RATIO_LT_5_0
    component bits67 = Num2Bits(32);
    bits67.in <== values[67];
    component cmp67 = LessThan(32);
    cmp67.in[0] <== values[67];
    cmp67.in[1] <== 50;
    signal isOk67;
    isOk67 <== cmp67.out;
    outs[67] <== reqs[67] * isOk67;
    reqs[67] * (outs[67] - isOk67) === 0;

    // TOTAL_TO_HDL_RATIO_LT_4_0
    component bits68 = Num2Bits(32);
    bits68.in <== values[68];
    component cmp68 = LessThan(32);
    cmp68.in[0] <== values[68];
    cmp68.in[1] <== 40;
    signal isOk68;
    isOk68 <== cmp68.out;
    outs[68] <== reqs[68] * isOk68;
    reqs[68] * (outs[68] - isOk68) === 0;

    // VLDL_LT_30
    component bits69 = Num2Bits(32);
    bits69.in <== values[69];
    component cmp69 = LessThan(32);
    cmp69.in[0] <== values[69];
    cmp69.in[1] <== 300;
    signal isOk69;
    isOk69 <== cmp69.out;
    outs[69] <== reqs[69] * isOk69;
    reqs[69] * (outs[69] - isOk69) === 0;

    // APOB_LT_100
    component bits70 = Num2Bits(32);
    bits70.in <== values[70];
    component cmp70 = LessThan(32);
    cmp70.in[0] <== values[70];
    cmp70.in[1] <== 1000;
    signal isOk70;
    isOk70 <== cmp70.out;
    outs[70] <== reqs[70] * isOk70;
    reqs[70] * (outs[70] - isOk70) === 0;

    // APOA1_GT_120
    component bits71 = Num2Bits(32);
    bits71.in <== values[71];
    component cmp71 = LessThan(32);
    cmp71.in[0] <== 1200;
    cmp71.in[1] <== values[71];
    signal isOk71;
    isOk71 <== cmp71.out;
    outs[71] <== reqs[71] * isOk71;
    reqs[71] * (outs[71] - isOk71) === 0;

    // LIPOPROTEIN_A_LT_50
    component bits72 = Num2Bits(32);
    bits72.in <== values[72];
    component cmp72 = LessThan(32);
    cmp72.in[0] <== values[72];
    cmp72.in[1] <== 500;
    signal isOk72;
    isOk72 <== cmp72.out;
    outs[72] <== reqs[72] * isOk72;
    reqs[72] * (outs[72] - isOk72) === 0;

    // HS_CRP_LT_3_0
    component bits73 = Num2Bits(32);
    bits73.in <== values[73];
    component cmp73 = LessThan(32);
    cmp73.in[0] <== values[73];
    cmp73.in[1] <== 30;
    signal isOk73;
    isOk73 <== cmp73.out;
    outs[73] <== reqs[73] * isOk73;
    reqs[73] * (outs[73] - isOk73) === 0;

    // BNP_LT_100
    component bits74 = Num2Bits(32);
    bits74.in <== values[74];
    component cmp74 = LessThan(32);
    cmp74.in[0] <== values[74];
    cmp74.in[1] <== 1000;
    signal isOk74;
    isOk74 <== cmp74.out;
    outs[74] <== reqs[74] * isOk74;
    reqs[74] * (outs[74] - isOk74) === 0;

    // HEMOGLOBIN_GT_12_0
    component bits75 = Num2Bits(32);
    bits75.in <== values[75];
    component cmp75 = LessThan(32);
    cmp75.in[0] <== 120;
    cmp75.in[1] <== values[75];
    signal isOk75;
    isOk75 <== cmp75.out;
    outs[75] <== reqs[75] * isOk75;
    reqs[75] * (outs[75] - isOk75) === 0;

    // HEMOGLOBIN_GT_13_0
    component bits76 = Num2Bits(32);
    bits76.in <== values[76];
    component cmp76 = LessThan(32);
    cmp76.in[0] <== 130;
    cmp76.in[1] <== values[76];
    signal isOk76;
    isOk76 <== cmp76.out;
    outs[76] <== reqs[76] * isOk76;
    reqs[76] * (outs[76] - isOk76) === 0;

    // HEMOGLOBIN_LT_17_5
    component bits77 = Num2Bits(32);
    bits77.in <== values[77];
    component cmp77 = LessThan(32);
    cmp77.in[0] <== values[77];
    cmp77.in[1] <== 175;
    signal isOk77;
    isOk77 <== cmp77.out;
    outs[77] <== reqs[77] * isOk77;
    reqs[77] * (outs[77] - isOk77) === 0;

    // HEMATOCRIT_GT_36
    component bits78 = Num2Bits(32);
    bits78.in <== values[78];
    component cmp78 = LessThan(32);
    cmp78.in[0] <== 360;
    cmp78.in[1] <== values[78];
    signal isOk78;
    isOk78 <== cmp78.out;
    outs[78] <== reqs[78] * isOk78;
    reqs[78] * (outs[78] - isOk78) === 0;

    // HEMATOCRIT_LT_52
    component bits79 = Num2Bits(32);
    bits79.in <== values[79];
    component cmp79 = LessThan(32);
    cmp79.in[0] <== values[79];
    cmp79.in[1] <== 520;
    signal isOk79;
    isOk79 <== cmp79.out;
    outs[79] <== reqs[79] * isOk79;
    reqs[79] * (outs[79] - isOk79) === 0;

    // WBC_GT_4_0
    component bits80 = Num2Bits(32);
    bits80.in <== values[80];
    component cmp80 = LessThan(32);
    cmp80.in[0] <== 40;
    cmp80.in[1] <== values[80];
    signal isOk80;
    isOk80 <== cmp80.out;
    outs[80] <== reqs[80] * isOk80;
    reqs[80] * (outs[80] - isOk80) === 0;

    // WBC_LT_11_0
    component bits81 = Num2Bits(32);
    bits81.in <== values[81];
    component cmp81 = LessThan(32);
    cmp81.in[0] <== values[81];
    cmp81.in[1] <== 110;
    signal isOk81;
    isOk81 <== cmp81.out;
    outs[81] <== reqs[81] * isOk81;
    reqs[81] * (outs[81] - isOk81) === 0;

    // PLATELETS_GT_150
    component bits82 = Num2Bits(32);
    bits82.in <== values[82];
    component cmp82 = LessThan(32);
    cmp82.in[0] <== 1500;
    cmp82.in[1] <== values[82];
    signal isOk82;
    isOk82 <== cmp82.out;
    outs[82] <== reqs[82] * isOk82;
    reqs[82] * (outs[82] - isOk82) === 0;

    // PLATELETS_LT_450
    component bits83 = Num2Bits(32);
    bits83.in <== values[83];
    component cmp83 = LessThan(32);
    cmp83.in[0] <== values[83];
    cmp83.in[1] <== 4500;
    signal isOk83;
    isOk83 <== cmp83.out;
    outs[83] <== reqs[83] * isOk83;
    reqs[83] * (outs[83] - isOk83) === 0;

    // RBC_GT_4_0
    component bits84 = Num2Bits(32);
    bits84.in <== values[84];
    component cmp84 = LessThan(32);
    cmp84.in[0] <== 40;
    cmp84.in[1] <== values[84];
    signal isOk84;
    isOk84 <== cmp84.out;
    outs[84] <== reqs[84] * isOk84;
    reqs[84] * (outs[84] - isOk84) === 0;

    // MCV_GT_80
    component bits85 = Num2Bits(32);
    bits85.in <== values[85];
    component cmp85 = LessThan(32);
    cmp85.in[0] <== 800;
    cmp85.in[1] <== values[85];
    signal isOk85;
    isOk85 <== cmp85.out;
    outs[85] <== reqs[85] * isOk85;
    reqs[85] * (outs[85] - isOk85) === 0;

    // MCV_LT_100
    component bits86 = Num2Bits(32);
    bits86.in <== values[86];
    component cmp86 = LessThan(32);
    cmp86.in[0] <== values[86];
    cmp86.in[1] <== 1000;
    signal isOk86;
    isOk86 <== cmp86.out;
    outs[86] <== reqs[86] * isOk86;
    reqs[86] * (outs[86] - isOk86) === 0;

    // RDW_LT_15
    component bits87 = Num2Bits(32);
    bits87.in <== values[87];
    component cmp87 = LessThan(32);
    cmp87.in[0] <== values[87];
    cmp87.in[1] <== 150;
    signal isOk87;
    isOk87 <== cmp87.out;
    outs[87] <== reqs[87] * isOk87;
    reqs[87] * (outs[87] - isOk87) === 0;

    // NEUTROPHILS_LT_75
    component bits88 = Num2Bits(32);
    bits88.in <== values[88];
    component cmp88 = LessThan(32);
    cmp88.in[0] <== values[88];
    cmp88.in[1] <== 750;
    signal isOk88;
    isOk88 <== cmp88.out;
    outs[88] <== reqs[88] * isOk88;
    reqs[88] * (outs[88] - isOk88) === 0;

    // LYMPHOCYTES_GT_20
    component bits89 = Num2Bits(32);
    bits89.in <== values[89];
    component cmp89 = LessThan(32);
    cmp89.in[0] <== 200;
    cmp89.in[1] <== values[89];
    signal isOk89;
    isOk89 <== cmp89.out;
    outs[89] <== reqs[89] * isOk89;
    reqs[89] * (outs[89] - isOk89) === 0;

    // ESR_LT_20
    component bits90 = Num2Bits(32);
    bits90.in <== values[90];
    component cmp90 = LessThan(32);
    cmp90.in[0] <== values[90];
    cmp90.in[1] <== 200;
    signal isOk90;
    isOk90 <== cmp90.out;
    outs[90] <== reqs[90] * isOk90;
    reqs[90] * (outs[90] - isOk90) === 0;

    // CRP_LT_5
    component bits91 = Num2Bits(32);
    bits91.in <== values[91];
    component cmp91 = LessThan(32);
    cmp91.in[0] <== values[91];
    cmp91.in[1] <== 50;
    signal isOk91;
    isOk91 <== cmp91.out;
    outs[91] <== reqs[91] * isOk91;
    reqs[91] * (outs[91] - isOk91) === 0;

    // FERRITIN_GT_30
    component bits92 = Num2Bits(32);
    bits92.in <== values[92];
    component cmp92 = LessThan(32);
    cmp92.in[0] <== 300;
    cmp92.in[1] <== values[92];
    signal isOk92;
    isOk92 <== cmp92.out;
    outs[92] <== reqs[92] * isOk92;
    reqs[92] * (outs[92] - isOk92) === 0;

    // FERRITIN_LT_400
    component bits93 = Num2Bits(32);
    bits93.in <== values[93];
    component cmp93 = LessThan(32);
    cmp93.in[0] <== values[93];
    cmp93.in[1] <== 4000;
    signal isOk93;
    isOk93 <== cmp93.out;
    outs[93] <== reqs[93] * isOk93;
    reqs[93] * (outs[93] - isOk93) === 0;

    // INR_LT_1_2
    component bits94 = Num2Bits(32);
    bits94.in <== values[94];
    component cmp94 = LessThan(32);
    cmp94.in[0] <== values[94];
    cmp94.in[1] <== 12;
    signal isOk94;
    isOk94 <== cmp94.out;
    outs[94] <== reqs[94] * isOk94;
    reqs[94] * (outs[94] - isOk94) === 0;

    // PT_LT_14
    component bits95 = Num2Bits(32);
    bits95.in <== values[95];
    component cmp95 = LessThan(32);
    cmp95.in[0] <== values[95];
    cmp95.in[1] <== 140;
    signal isOk95;
    isOk95 <== cmp95.out;
    outs[95] <== reqs[95] * isOk95;
    reqs[95] * (outs[95] - isOk95) === 0;

    // APTT_LT_35
    component bits96 = Num2Bits(32);
    bits96.in <== values[96];
    component cmp96 = LessThan(32);
    cmp96.in[0] <== values[96];
    cmp96.in[1] <== 350;
    signal isOk96;
    isOk96 <== cmp96.out;
    outs[96] <== reqs[96] * isOk96;
    reqs[96] * (outs[96] - isOk96) === 0;

    // TSH_GT_0_4
    component bits97 = Num2Bits(32);
    bits97.in <== values[97];
    component cmp97 = LessThan(32);
    cmp97.in[0] <== 4;
    cmp97.in[1] <== values[97];
    signal isOk97;
    isOk97 <== cmp97.out;
    outs[97] <== reqs[97] * isOk97;
    reqs[97] * (outs[97] - isOk97) === 0;

    // TSH_LT_4_5
    component bits98 = Num2Bits(32);
    bits98.in <== values[98];
    component cmp98 = LessThan(32);
    cmp98.in[0] <== values[98];
    cmp98.in[1] <== 45;
    signal isOk98;
    isOk98 <== cmp98.out;
    outs[98] <== reqs[98] * isOk98;
    reqs[98] * (outs[98] - isOk98) === 0;

    // FREE_T4_GT_0_8
    component bits99 = Num2Bits(32);
    bits99.in <== values[99];
    component cmp99 = LessThan(32);
    cmp99.in[0] <== 8;
    cmp99.in[1] <== values[99];
    signal isOk99;
    isOk99 <== cmp99.out;
    outs[99] <== reqs[99] * isOk99;
    reqs[99] * (outs[99] - isOk99) === 0;

    signal dummy;
    dummy <== nonce * 1;
}

component main { public [nonce, reqs] } = ClinicalPredicatesSelectiveV1();
