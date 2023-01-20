
/******************/
/* Modernisations */
/******************/

// Return Theoretical attitude from atm pressure
function getAltFromAtm(atmPressure, SOI) {
    // Example on Kerbin.
    // 1 atm = 0km
    // 0 atm = 70 km

    return SOI.KermanLine * (SOI.groundPressure - atmPressure);
}

// Get Estimated Atm Pressure from Dv from Ground
function AtmPressurEstimator(Dv_from_ground, SOI) {
    if(Dv_from_ground >= SOI.LowOrbitDv) return 0;

    // Inject atm model here
    return round( Math.ceil( ( SOI.LowOrbitDv - Dv_from_ground ) / SOI.LowOrbitDv * SOI.groundPressure ) );
}

function TwrCorrection(atmPressure, SOI, TwrData) {
    let estimateAlt = getAltFromAtm(atmPressure, SOI);
    return round(TwrData.min * (1 - estimateAlt/1000 * (TwrData.step / 10)));
}
