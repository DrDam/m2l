// List of SOI
const SOI = [
    { Name: "Kerbin", Go: 9.81, LowOrbitDv: 3400, groundPressure: 1, KermanLine: 70000 },
    { Name: "Mun", Go: 1.63, LowOrbitDv: 540, groundPressure: 0, KermanLine: 0 }
];

// The value of "MtankFull / MtankEmpty"
const TankFuelRatio = 8;

// Fuel Classification
const FuelTypes = {};
FuelTypes.LFO = 'Liquid Fuel and Oxydizer';
FuelTypes.LF = 'LiquidFuel';
FuelTypes.SF = 'SolidFuel';
FuelTypes.O = 'Oxydizer';
FuelTypes.M = 'MonoPropellant';
FuelTypes.X = 'XenonGas';

// Sizes
const Sizes = [
    { id: '0', label: 'Tiny - 0.625m' },
    { id: '1', label: 'Small - 1.25m' },
    { id: '1p5', label: 'Medium - 1.875m' },
    { id: '2', label: 'Large - 2.5m' },
    { id: '3', label: 'Extra Large - 3.75m' },
    { id: '4', label: 'Huge - 5m' },
    { id: 'mk1', label: 'Mk1 - 5m' },
    { id: 'mk2', label: 'Mk2' },
    { id: 'mk3', label: 'Mk3' }
];

// Providers
// En attente de "mise à plat des fichier de pieces pour making History
const providers = ['stock'];//, 'makingHistory'];

// Part Types
const partTypes = ['adapters', 'couplers', 'decouplers', 'engines', 'fuelTanks'];

// Load Parts
const Parts = {};

console.log("Load Parts");
for (let partTypesKey in partTypes) {

    Parts[partTypes[partTypesKey]] = [];

    for (let providersKey in providers) {

        fetch('../assets/parts/'+providers[providersKey]+'/'+partTypes[partTypesKey]+'.json')
            .then((response) => {
                if (response.ok) {
                    return response.json()
                }
                else {
                    return Promise.reject(response.status)
                }
            })
            .then((json) => {
                Parts[partTypes[partTypesKey]] = Parts[partTypes[partTypesKey]].concat(json);
                console.log("-- Load " + partTypes[partTypesKey] + " from " + providers[providersKey]);
            })
            .catch(error => {
                if(error === 404) {
                    console.log("-- No part files for "+ partTypes[partTypesKey] + " from " + providers[providersKey]);
                }
                else {
                    console.log("-- error on " + partTypes[partTypesKey] + " from " + providers[providersKey], error);
                }
            });
    }
}
