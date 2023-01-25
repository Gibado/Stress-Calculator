var StressModel = function() {
    var self = this;
    var LBS_TO_KG = 0.453592;
    var IN_TO_CM = 2.54;

    // Weight Constants
    var OPTIMAL_BMI = 21.7;
    var DANGEROUSLY_LOW_BMI = 13.5;
    var DANGEROUSLY_HIGH_BMI = 40;

    self.personalInfo = {
        age: 0,
        gender: null,
        units: null,
        weight: 0,
        height: 0,
        sleep: 0,
        // Calculated values
        // Current
        cWeightKG: 0,
        cHeightCM: 0,
        cHeightMeters: 0,
        lSleep: 0,
        hSleep: 0,
        cEnergy: 0,
        // Optimal
        oWeightKG: 0,
        oSleep: 0,
        // Scores
        wScore: 0,
        wDanger: 0,
        sScore: 0,
        sDanger: 0
    };

    self.UpdatePersonalInfo = function() {
        var info = self.personalInfo;
        info.age = parseInt($('#age')[0].value);
        info.gender = $('#gender')[0].value;
        info.units = $('#units')[0].value;
        info.weight = parseFloat($('#weight')[0].value);
        info.height = parseFloat($('#height')[0].value);
        info.sleep = parseFloat($('#sleep')[0].value);
        console.debug(self.personalInfo);
        self.CalculateResults();
    }

    self.CalculateResults = function() {
        if (self.ValidPersonalInfo()) {
            self.StandardizePersonalInfo();
            self.CalculateWeightScore();
            self.CalculateSleepScore();
            self.CalculateTotalDanger();
            self.UpdateDisplay();
            console.debug(self.personalInfo);
        } else {
            console.debug("Not enough info");
        }
    }

    self.ValidPersonalInfo = function() {
        var info = self.personalInfo;
        return info.age > 0 && info.weight > 0 && info.height > 0 &&
            info.gender !== 'Gender' &&
            info.units !== 'Units';
    }

    self.StandardizePersonalInfo = function() {
        var info = self.personalInfo;
        if (info.units === 'metric') {
            info.cWeightKG = info.weight;
        } else {
            info.cWeightKG = info.weight * LBS_TO_KG;
        }

        if (info.units === 'metric') {
            info.cHeightCM = info.height;
        } else {
            info.cHeightCM = info.height * IN_TO_CM;
        }
        info.cHeightMeters = info.cHeightCM / 100;
    }

    self.CalculateWeightScore = function() {
        self.CalculateBMI();
        self.CalculateBMR();
        var info = self.personalInfo;
        info.dBMR = Math.abs(info.oBMR - info.cBMR);
        info.wScore = info.dBMR.toFixed(0);
    }

    self.CalculateBMI = function() {
        var info = self.personalInfo;
        info.cBMI = info.cWeightKG / Math.pow(info.cHeightMeters, 2);
        info.oWeightKG = OPTIMAL_BMI * Math.pow(info.cHeightMeters, 2);
    }

    self.CalculateBMR = function() {
        var info = self.personalInfo;
        var cMsj = self.CalculateMSJ(info.age, info.gender, info.cWeightKG, info.cHeightCM);
        var oMsj = self.CalculateMSJ(info.age, info.gender, info.oWeightKG, info.cHeightCM);

        var cRhb = self.CalculateRHB(info.age, info.gender, info.cWeightKG, info.cHeightCM);
        var oRhb = self.CalculateRHB(info.age, info.gender, info.oWeightKG, info.cHeightCM);

        info.cBMR = (cMsj + cRhb) / 2;
        info.oBMR = (oMsj + oRhb) / 2;
    }

    self.CalculateMSJ = function(age, gender, weightKG, heightCM) {
        var genderModifier = 5;
        if (gender !== 'male') {
            genderModifier = -161;
        }
        return (10 * weightKG) + (6.25 * heightCM) - (5 * age) + genderModifier;
    }

    self.CalculateRHB = function(age, gender, weightKG, heightCM) {
        var weightModifier = 13.397;
        var heightModifier = 4.799;
        var ageModifier = 5.677
        var genderModifier = 88.362;
        if (gender !== 'male') {
            weightModifier = 9.247;
            heightModifier = 3.098;
            ageModifier = 4.33
            genderModifier = 447.593;
        }

        return (weightModifier * weightKG) + (heightModifier * heightCM) - (ageModifier * age) + genderModifier;
    }

    self.CalculateSleepScore = function() {
        self.AssignSleepRange();
        var info = self.personalInfo;
        info.oSleep = (info.lSleep + info.hSleep) / 2;
        info.sScore = 0;
        if (info.lSleep - info.sleep > 0) {
            info.sScore = info.lSleep - info.sleep;
        } else if (info.sleep - info.hSleep > 0) {
            info.sScore = info.sleep - info.hSleep;
        }
        var energyRecoverRate = info.oSleep / 24;
        info.cEnergy = info.sleep / energyRecoverRate;
    }

    self.AssignSleepRange = function() {
        var info = self.personalInfo;
        if (info.age < 3) {
            info.lSleep = 11;
            info.hSleep = 14;
        } else if (info.age < 6) {
            info.lSleep = 10;
            info.hSleep = 13;
        } else if (info.age < 14) {
            info.lSleep = 9;
            info.hSleep = 11;
        } else if (info.age < 18) {
            info.lSleep = 8;
            info.hSleep = 10;
        } else if (info.age < 65) {
            info.lSleep = 7;
            info.hSleep = 9;
        } else {
            info.lSleep = 7;
            info.hSleep = 8;
        }
    }

    self.CalculateTotalDanger = function() {
        self.CalculateWeightDanger();
        self.CalculateSleepDanger();
        var info = self.personalInfo;
        info.tDanger = info.wDanger + info.sDanger;
    }

    self.CalculateWeightDanger = function() {
        var info = self.personalInfo;
        info.wDanger = self.CalculateDanger(info.cBMI, OPTIMAL_BMI, DANGEROUSLY_LOW_BMI, DANGEROUSLY_HIGH_BMI);
    }

    self.CalculateSleepDanger = function() {
        var info = self.personalInfo;
        var target;
        var danger;
        if (info.sleep < info.lSleep) {
            target = info.lSleep;
            danger = info.lSleep / 2;
        } else if (info.sleep > info.hSleep) {
            target = info.hSleep;
            danger = (info.hSleep + 24) / 2;
        } else {
            info.sDanger = 0;
            return;
        }
        info.sDanger = self.DangerPercent(info.sleep, target, danger);
    }

    self.CalculateDanger = function(current, optimal, tooLow, tooHigh) {
        var lowDanger = (current - optimal) / (tooLow - optimal);
        var highDanger = (current - optimal) / (tooHigh - optimal);
        return lowDanger > highDanger ? lowDanger : highDanger;
    }

    self.DangerPercent = function(current, target, danger) {
        return (current - target) / (danger - target);
    }

    self.UpdateDisplay = function() {
        var info = self.personalInfo;
        // Weight based score
        $('#bmi')[0].value = info.cBMI.toFixed(2);
        var unitModifier = 1;
        if (info.units === 'imperial') {
            unitModifier = LBS_TO_KG;
        }
        $('#o-weight')[0].value = (info.oWeightKG / unitModifier).toFixed(2);

        $('#c-bmr')[0].value = info.cBMR.toFixed(1);
        $('#o-bmr')[0].value = info.oBMR.toFixed(1);
        $('#d-bmr')[0].value = info.dBMR.toFixed(1);
        $('#weight-score')[0].textContent = info.wScore;

        // Sleep based score
        $('#d-sleep')[0].value = Math.abs(info.oSleep - info.sleep).toFixed(1);
        $('#o-sleep')[0].value = info.oSleep.toFixed(1);
        $('#c-energy')[0].value = info.cEnergy.toFixed(1);
        $('#sleep-score')[0].textContent = info.sScore.toFixed(2);

        // Danger Display
        var totalDanger = info.wDanger + info.sDanger;
        $('#total-score')[0].textContent = self.ConvertToDisplayPercent(totalDanger);
        // Update accumulated
        self.updateProgressBar($('#danger-weight')[0], info.wDanger);
        self.updateProgressBar($('#danger-sleep')[0], info.sDanger);
        // Update distribution
        self.updateProgressBar($('#danger-dist-weight')[0], info.wDanger / totalDanger);
        self.updateProgressBar($('#danger-dist-sleep')[0], info.sDanger / totalDanger);
    }

    self.ConvertToDisplayPercent = function(percent) {
        return (percent * 100).toFixed(2);
    }

    self.updateProgressBar = function(bar, percent) {
        var displayable = self.ConvertToDisplayPercent(percent);
        bar.style.width = displayable + '%';
        bar.ariaValueNow = displayable;
    }

    self.UpdateUnitDisplay = function() {
        var info = self.personalInfo;
        var weightUnit = '(?)';
        var heightUnit = '(?)';
        if (info.units === 'imperial') {
            weightUnit = '(lbs)';
            heightUnit = '(in)';
        } else if (info.units === 'metric') {
            weightUnit = '(kg)';
            heightUnit = '(cm)';
        }

        $('.weight-type').toArray().forEach(element => {
            element.textContent = weightUnit;
        });
        $('.height-type').toArray().forEach(element => {
            element.textContent = heightUnit;
        });

        self.UpdateDisplay();
    }

    self.test = function() {
        $('#age')[0].value = 33;
        $('#gender')[0].value = 'male';
        $('#weight')[0].value = 190;
        $('#height')[0].value = 70;
        $('#units')[0].value = 'imperial';
        $('#sleep')[0].value = 5;
        self.UpdatePersonalInfo();
        self.UpdateUnitDisplay();
    }

    return self;
}

var model = StressModel();

jQuery(document).ready(function($) {
    //model.test();
    // Auto-update personal info
    $('input, select').toArray().forEach(element => {
        element.onchange = function() {
            model.UpdatePersonalInfo();
        }
    });
    $('#units')[0].onchange = function() {
        model.UpdatePersonalInfo();
        model.UpdateUnitDisplay();
    }
});