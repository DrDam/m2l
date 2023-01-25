/*******************/
/* Model elements */
/*****************/

/**
 * Use engine curve to obtain local ISP & Thrust.
 *
 * @param engineCurve
 *   The entire engine.curve value.
 * @param AtmPressur
 *   Local atmospheric pressure.
 *
 * @returns A engine.curve element, or calculated one.
 */
function getCaractForAtm(engineCurve, AtmPressur) {

    // if AtmPressure need is vaccum, return first value of curve
    if(AtmPressur === 0) {
        return engineCurve[0];
    }

    // Atmo curve are atm ascendent
    for(let point in engineCurve) {
        // if AtmPressur > last curve point (the highest pressure known), return it.
        if(engineCurve[point].atmo <= AtmPressur && typeof engineCurve[point+1] == 'undefined') {
            return engineCurve[point];
        }

        // Estimate value for atm pressure
        if(engineCurve[point].atmo <= AtmPressur && engineCurve[point+1].atmo > AtmPressur) {
            let atm_diff = engineCurve[point+1].atmo - engineCurve[point].atmo;
            let ISP_deriv = (engineCurve[point+1].ISP - engineCurve[point].ISP) / atm_diff;
            let Thrust_deriv = (engineCurve[point+1].Thrust - engineCurve[point].Thrust) / atm_diff;

            return {
                atmo:AtmPressur,
                ISP: ISP_deriv * AtmPressur + engineCurve[0].ISP,
                Thrust: Thrust_deriv * AtmPressur + engineCurve[0].Thrust,
            };
        }
    }

    console.log({'msg':'Error getCaractForAtm','curve':engineCurve, 'atm':AtmPressur});
}
/**
 * Use the selected Trajectory description to find Altitude from Dv from ground.
 *
 * @param Dv_from_ground
 *   Dv consumed from the ground.
 * @param trajectory
 *   The trajectory object.
 *
 * @returns The local altitude and the twrReduction we can apply here.
 */
function getTrajectoryState(Dv_from_ground, trajectory){

    // Dv_from_ground from ground are negative, set it to 0.
    if(Dv_from_ground < 0) {
        Dv_from_ground = 0;
    }

    for(let trajectoryStep in trajectory.steps) {

        // If we reach the last point, return it.
        if(trajectory.steps[trajectoryStep].dv <= Dv_from_ground && typeof trajectory.steps[trajectoryStep+1] == 'undefined') {
            return  {
                twrReduction: trajectory.steps[trajectoryStep].twrReduction,
                alt: trajectory.steps[trajectoryStep].alt,
            };
        }

        // Estimate value between 2 points
        if(trajectory.steps[trajectoryStep].dv <= Dv_from_ground && trajectory.steps[trajectoryStep+1].dv > Dv_from_ground) {

            let dvDiff = trajectory.steps[trajectoryStep+1].dv - trajectory.steps[trajectoryStep].dv;
            let altDeriv = (trajectory.steps[trajectoryStep+1].alt - trajectory.steps[trajectoryStep].alt) / dvDiff;
            let twrDeriv = (trajectory.steps[trajectoryStep+1].twrReduction - trajectory.steps[trajectoryStep].twrReduction) / dvDiff;

            return  {
                twrReduction: twrDeriv * Dv_from_ground + trajectory.steps[0].twrReduction,
                alt: altDeriv * Dv_from_ground + trajectory.steps[0].alt,
            };
        }
    }

    console.log({'msg':'Error getTrajectoryState','Dv_from_ground':Dv_from_ground, 'trajectory':trajectory});
}

/**
 * Use SOI atmosphere curve to find atmPressure at Alt
 *
 * @param currentAltitude
 *   Current altitude.
 * @param atmosphereCurve
 *   SOI atmosphere data.
 * @returns The local pressure.
 */
function getLocalPressureFromAlt(currentAltitude, atmosphereCurve) {

    for(let atmosphereStepCurve in atmosphereCurve) {

        // If we reach the last point, return it.
        if(atmosphereCurve[atmosphereStepCurve].alt <= currentAltitude && typeof atmosphereCurve[atmosphereStepCurve+1] == 'undefined') {
            return atmosphereCurve[atmosphereStepCurve].p;
        }

        // Estimate value between 2 points
        if(atmosphereCurve[atmosphereStepCurve].alt <= currentAltitude && atmosphereCurve[atmosphereStepCurve + 1].alt > currentAltitude) {
            let altDiff = atmosphereCurve[atmosphereStepCurve + 1].alt - atmosphereCurve[atmosphereStepCurve].alt;
            let pDeriv = (atmosphereCurve[atmosphereStepCurve+1].p - atmosphereCurve[atmosphereStepCurve].p) / altDiff;
            // return estimated local pressure.
            return pDeriv * alt + atmosphereCurve[0].p
        }
    }

    console.log({'msg':'Error getLocalPressureFromAlt','alt':currentAltitude, 'atm':atmosphereCurve});
}

/**
 * Apply trajectory TWR reducing.
 *
 * @param twr
 *   Absolute TWR value to reduce.
 * @param reduction
 *   The value of reduction (%).
 * @returns The TWR reduced.
 */
function reduceTwr(twr, reduction) {
    return (1 - (reduction / 100)) * twr;
}