// List of SOI
var SOI = {};
SOI.kerbin = { Name: "Kerbin", Go: 9.81 };

// Fuel Classification
var FuelTypes = {};
FuelTypes.LFO = 'Liquid Fuel and Oxydizer';
FuelTypes.LF = 'LiquidFuel';
FuelTypes.SF = 'SolidFuel';
FuelTypes.O = 'Oxydizer';
FuelTypes.M = 'MonoPropellant';
FuelTypes.X = 'XenonGas';

// Sizes
var Sizes = [
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
var providers = ['stock', 'makingHistory'];
// Part Types
var partTypes = ['adapters', 'couplers', 'decouplers', 'engines', 'fuelTanks'];

// Load Parts
var Parts = {};

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
            })
            .catch(error => {
                if(error == 404) {
                    console.log("Part files not exists.");
                }
                else {
                    console.log('error is', error);
                }
            });
    }
}