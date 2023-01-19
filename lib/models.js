
/*****************/
/* Modelisations */
/*****************/

// Return Theorical atitude from atm pressure
function getAltFromAtm(atm, SOI) {
    // 1 atm = 0km
    // 0 atm = 70 km
    
    return SOI.KermanLine * (SOI.groundPressure-atm);
}

// Get Estimated Atm Pressur from RestDv
function AtmPressurEstimator(RestDv, SOI) {
    if(RestDv >= SOI.LowOrbitDv) return 0;

    // Inject atm modele here
    return Math.ceil(RestDv/SOI.LowOrbitDv) * SOI.groundPressure;
}
