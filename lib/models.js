/**********/
/* Models */
/**********/

/**
 * Use engine curve to optain ISP & Thrust at the atmPressur
 */
function getCaractForAtm(engineCurve, AtmPressur) {

    // if AtmPressure need is vaccum, return it
    if(AtmPressur === 0) {
        return engineCurve[0];
    }
    // Else set vac values
    let vac_isp = engineCurve[0].ISP;
    let vac_thrust = engineCurve[0].Thrust;

    // Atmo curve are atm ascendent
    for(let point in engineCurve) {
        // if AtmPressur > last curve atmo (the highest pressure known)
        if(engineCurve[point].atmo <= AtmPressur && typeof engineCurve[point+1] == 'undefined') {
            return engineCurve[point];
        }

        // estimate value for atm pressure
        if(engineCurve[point].atmo <= AtmPressur && engineCurve[point+1].atmo > AtmPressur) {
            let atm_diff = engineCurve[point+1].atmo - engineCurve[point].atmo;
            let ISP_deriv = (engineCurve[point+1].ISP - engineCurve[point].ISP) / atm_diff;
            let Thrust_deriv = (engineCurve[point+1].Thrust - engineCurve[point].Thrust) / atm_diff;

            return {
                atmo:AtmPressur,
                ISP: ISP_deriv * AtmPressur + vac_isp,
                Thrust: Thrust_deriv * AtmPressur + vac_thrust,
            };
        }
    }

    console.log({'msg':'Error getCaractForAtm','curve':engineCurve, 'atm':AtmPressur});
}

/**
 * Use trajectory to find Alt from Dv from ground.
 */
function getTrajectoryState(Dv_from_ground, trajectory){

    if(Dv_from_ground < 0) {
        Dv_from_ground = 0;
    }

    // return  { dv: XX, alt: YY},
    for(let trajectoryStep in trajectory) {
        // Last point
        if(trajectory[trajectoryStep].dv <= Dv_from_ground && typeof trajectory[trajectoryStep+1] == 'undefined') {
            return trajectory[trajectoryStep];
        }

        if(trajectory[trajectoryStep].dv <= Dv_from_ground && trajectory[trajectoryStep + 1].dv > Dv_from_ground) {
            let dvDiff = trajectory[trajectoryStep+1].dv - trajectory[trajectoryStep].dv;
            let altDeriv = (trajectory[trajectoryStep+1].alt - trajectory[trajectoryStep].alt) / dvDiff;

            return  {
                alt: altDeriv * Dv_from_ground + trajectory[0].alt,
            };
        }
    }

    console.log({'msg':'Error getTrajectoryState','Dv_from_ground':Dv_from_ground, 'trajectory':trajectory});
}

/**
 * Use SOI atmosphere curve to find atmPressure at Alt
 */
function getLocalPressureFromAlt(alt, atmosphereCurve) {

    for(let atmosphereStepCurve in atmosphereCurve) {
        // Last point
        if(atmosphereCurve[atmosphereStepCurve].alt <= alt && typeof atmosphereCurve[atmosphereStepCurve+1] == 'undefined') {
            return atmosphereCurve[atmosphereStepCurve].p;
        }

        if(atmosphereCurve[atmosphereStepCurve].alt <= alt && atmosphereCurve[atmosphereStepCurve + 1].alt > alt) {
            let altDiff = atmosphereCurve[atmosphereStepCurve + 1].alt - atmosphereCurve[atmosphereStepCurve].alt;
            let pDeriv = (atmosphereCurve[atmosphereStepCurve+1].p - atmosphereCurve[atmosphereStepCurve].p) / altDiff;
            return pDeriv * alt + atmosphereCurve[0].p
        }
    }

    console.log({'msg':'Error getLocalPressureFromAlt','alt':alt, 'atm':atmosphereCurve});
}
