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
