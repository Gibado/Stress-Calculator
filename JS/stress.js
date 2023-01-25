var StressModel = function() {
    var self = this;
    var LBS_TO_KG = 0.453592;
    var IN_TO_CM = 2.54;

    // Weight Constants
    var OPTIMAL_BMI = 21.7;
    var DANGEROUSLY_LOW_BMI = 13.5;
    var DANGEROUSLY_HIGH_BMI = 40;
    var DANGER_LOW_BMI_FACTOR = DANGEROUSLY_LOW_BMI - OPTIMAL_BMI;
    var DANGER_HIGH_BMI_FACTOR = DANGEROUSLY_HIGH_BMI - OPTIMAL_BMI;

    self.personalInfo = {
        age: 0,
        gender: null,
        units: null,
        weight: 0,
        height: 0,
        // Calculated values
        // Current
        cWeightKG: 0,
        cHeightCM: 0,
        cHeightMeters: 0,
        // Optimal
        oWeightKG: 0,
        // Scores
        wScore: 0,
        wDanger: 0
    };

    self.UpdatePersonalInfo = function() {
        var info = self.personalInfo;
        info.age = parseInt($('#age')[0].value);
        info.gender = $('#gender')[0].value;
        info.units = $('#units')[0].value;
        info.weight = parseFloat($('#weight')[0].value);
        info.height = parseFloat($('#height')[0].value);
        console.debug(self.personalInfo);
        self.CalculateResults();
    }

    self.CalculateResults = function() {
        if (self.ValidPersonalInfo()) {
            self.StandardizePersonalInfo();
            self.CalcuateWeightScore();
            self.CalcuateTotalDanger();
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

    self.CalcuateWeightScore = function() {
        self.CalcuateBMI();
        self.CalcuateBMR();
        var info = self.personalInfo;
        info.dBMR = Math.abs(info.oBMR - info.cBMR);
        info.wScore = info.dBMR.toFixed(0);
    }

    self.CalcuateBMI = function() {
        var info = self.personalInfo;
        info.cBMI = info.cWeightKG / Math.pow(info.cHeightMeters, 2);
        info.oWeightKG = OPTIMAL_BMI * Math.pow(info.cHeightMeters, 2);
    }

    self.CalcuateBMR = function() {
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

    self.CalcuateTotalDanger = function() {
        var info = self.personalInfo;
        self.CalcuateWeightDanger();
        info.tDanger = info.wDanger;
    }

    self.CalcuateWeightDanger = function() {
        var info = self.personalInfo;
        var lowDanger = (info.cBMI - OPTIMAL_BMI) / DANGER_LOW_BMI_FACTOR;
        var highDanger = (info.cBMI - OPTIMAL_BMI) / DANGER_HIGH_BMI_FACTOR;
        info.wDanger = lowDanger > highDanger ? lowDanger : highDanger;
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

        // Danger Display
        var wPercent = (info.wDanger * 100).toFixed(2);
        var totalDanger = info.wDanger;
        $('#total-score')[0].textContent = wPercent;
        // Update accumulated
        self.updateProgressBar($('#danger-weight')[0], wPercent);
        // Update distribution
        self.updateProgressBar($('#danger-dist-weight')[0], (info.wDanger / totalDanger * 100).toFixed(2));
    }

    self.updateProgressBar = function(bar, percent) {
        bar.style.width = percent + '%';
        bar.ariaValueNow = percent;
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
        self.UpdatePersonalInfo();
        self.UpdateUnitDisplay();
    }

    return self;
}

var model = StressModel();

jQuery(document).ready(function($) {
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