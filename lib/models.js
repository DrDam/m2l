
/******************/
/* Modernisations */
/******************/

// Return Theoretical attitude from atm pressure
function getAltFromAtm(atm, SOI) {
    // Example on Kerbin.
    // 1 atm = 0km
    // 0 atm = 70 km

    return SOI.KermanLine * (SOI.groundPressure - atm);
}

// Get Estimated Atm Pressure from Dv from Ground
function AtmPressurEstimator(Dv_from_ground, SOI) {
    if(Dv_from_ground >= SOI.LowOrbitDv) return 0;

    // Inject atm model here
    return round(Math.ceil(Dv_from_ground/SOI.LowOrbitDv * SOI.groundPressure));
}

function TwrCorrection(atm, SOI, TwrData) {
    let estimateAlt = getAltFromAtm(atm, SOI);
    return round(TwrData.min * (1 - estimateAlt/1000 * (TwrData.step / 10)));
}