
/*****************/
/* Modelisations */
/*****************/

// Return Theorical atitude from atm pressure
function getAltFromAtm(atm) {
    // 1 atm = 0km
    // 0 atm = 70 km
    
    return 70000 * (1-atm);
}

// Get Estimated Atm Pressur from RestDv
function AtmPressurEstimator(RestDv) {
    if(RestDv >= 3500) return 0;

    // Inject atm modele here
    return Math.ceil(RestDv/3500);
}
