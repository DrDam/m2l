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
var providers = ['stock'];

// Parts
var Parts = {};
Parts.adapters = [
        {
            "id": "Size3to2Adapter",
            "name": "Kerbodyne ADTP-2-3",
            "tech": "largeVolumeContainment",
            "cost": 2600,
            "provider": "stock",
            "mass": {
                "empty": 0.2,
                "full": 0.2
            },
            "stackable": {
                "top": "2",
                "bottom": "3"
            }
        },
        {
            "id": "adapterSmallMiniShort",
            "name": "FL-A5 Adapter",
            "tech": "miniaturization",
            "cost": 100,
            "provider": "stock",
            "mass": {
                "empty": 0.04,
                "full": 0.04
            },
            "stackable": {
                "top": "0",
                "bottom": "1"
            }
        },
        {
            "id": "adapterSmallMiniTall",
            "name": "FL-A10 Adapter",
            "tech": "miniaturization",
            "cost": 150,
            "provider": "stock",
            "mass": {
                "empty": 0.05,
                "full": 0.05
            },
            "stackable": {
                "top": "0",
                "bottom": "1"
            }
        },
        {
            "id": "largeAdapter2",
            "name": "Rockomax Brand Adapter 02",
            "tech": "advConstruction",
            "cost": 450,
            "provider": "stock",
            "mass": {
                "empty": 0.08,
                "full": 0.08
            },
            "stackable": {
                "top": "1",
                "bottom": "2"
            }
        }
    ];
Parts.couplers = [
        {
            "id": "adapterLargeSmallBi",
            "name": "TVR-200L Stack Bi-Adapter",
            "tech": "metaMaterials",
            "cost": 400,
            "provider": "stock",
            "mass": {
                "empty": 0.1,
                "full": 0.1
            },
            "stackable": {
                "top": "2",
                "bottom": "1",
                "bottom_number": 2
            }
        },
        {
            "id": "adapterLargeSmallQuad",
            "name": "TVR-400L Stack Quad-Adapter",
            "tech": "metaMaterials",
            "cost": 800,
            "provider": "stock",
            "mass": {
                "empty": 0.2,
                "full": 0.2
            },
            "stackable": {
                "top": "2",
                "bottom": "1",
                "bottom_number": 4
            }
        },
        {
            "id": "adapterLargeSmallTri",
            "name": "TVR-300L Stack Tri-Adapter",
            "tech": "metaMaterials",
            "cost": 600,
            "provider": "stock",
            "mass": {
                "empty": 0.15,
                "full": 0.15
            },
            "stackable": {
                "top": "2",
                "bottom": "1",
                "bottom_number": 3
            }
        },
        {
            "id": "stackBiCoupler",
            "name": "TVR-200 Stack Bi-Coupler",
            "tech": "specializedConstruction",
            "cost": 400,
            "provider": "stock",
            "mass": {
                "empty": 0.1,
                "full": 0.1
            },
            "stackable": {
                "top": "1",
                "bottom": "1",
                "bottom_number": 2
            }
        },
        {
            "id": "stackQuadCoupler",
            "name": "TVR-2160C Mk2 Stack Quad-Coupler",
            "tech": "advMetalworks",
            "cost": 2000,
            "provider": "stock",
            "mass": {
                "empty": 0.175,
                "full": 0.175
            },
            "stackable": {
                "top": "1",
                "bottom": "1",
                "bottom_number": 4
            }
        },
        {
            "id": "stackTriCoupler",
            "name": "TVR-1180C Mk1 Stack Tri-Coupler",
            "tech": "advConstruction",
            "cost": 680,
            "provider": "stock",
            "mass": {
                "empty": 0.15,
                "full": 0.15
            },
            "stackable": {
                "top": "1",
                "bottom": "1",
                "bottom_number": 3
            }
        }
    ];

Parts.decouplers = [
        {
            "id": "Decoupler_0",
            "name": "TD-06 Decoupler",
            "tech": "precisionEngineering",
            "cost": 300,
            "provider": "stock",
            "mass": {
                "empty": 0.01,
                "full": 0.01
            },
            "size": "0",
            "is_radial": false
        },
        {
            "id": "Decoupler_1",
            "name": "TD-12 Decoupler",
            "tech": "engineering101",
            "cost": 400,
            "provider": "stock",
            "mass": {
                "empty": 0.04,
                "full": 0.04
            },
            "size": "1",
            "is_radial": false
        },
        {
            "id": "Decoupler_2",
            "name": "TD-25 Decoupler",
            "tech": "generalConstruction",
            "cost": 550,
            "provider": "stock",
            "mass": {
                "empty": 0.16,
                "full": 0.16
            },
            "size": "2",
            "is_radial": false
        },
        {
            "id": "Decoupler_3",
            "name": "TD-37 Decoupler",
            "tech": "largeVolumeContainment",
            "cost": 600,
            "provider": "stock",
            "mass": {
                "empty": 0.36,
                "full": 0.36
            },
            "size": "3",
            "is_radial": false
        },
        {
            "id": "Radial",
            "name": "TT-38K Radial Decoupler",
            "tech": "largeVolumeContainment",
            "cost": 600,
            "provider": "stock",
            "mass": {
                "empty": 0.25,
                "full": 0.25
            },
            "size": false,
            "is_radial": true
        }
    ];

Parts.engines = [
        {
            "id": "MassiveBooster",
            "name": "S1 SRB-KD25k \"Kickback\" Solid Fuel Booster",
            "tech": "heavyRocketry",
            "cost": 2700,
            "provider": "stock",
            "mass": {
                "empty": 4.5,
                "full": 24
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 220,
                    "Thrust": 670
                },
                {
                    "atmo": 1,
                    "ISP": 195,
                    "Thrust": 593.8636
                },
                {
                    "atmo": 7,
                    "ISP": 0.001,
                    "Thrust": 0.003
                }
            ],
            "conso": [
                "SolidFuel"
            ]
        },
        {
            "id": "omsEngine",
            "name": "O-10 \"Puff\" MonoPropellant Fuel Engine",
            "tech": "precisionPropulsion",
            "cost": 150,
            "provider": "stock",
            "mass": {
                "empty": 0.09,
                "full": 0.09
            },
            "stackable": {
                "top": false,
                "bottom": false
            },
            "is_radial": true,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 250,
                    "Thrust": 20
                },
                {
                    "atmo": 1,
                    "ISP": 120,
                    "Thrust": 9.6
                },
                {
                    "atmo": 4,
                    "ISP": 0.001,
                    "Thrust": 0.0001
                }
            ],
            "conso": [
                "MonoPropellant"
            ]
        },
        {
            "id": "Size2LFB",
            "name": "LFB KR-1x2 \"Twin-Boar\" Liquid Fuel Engine",
            "tech": "heavierRocketry",
            "cost": 17000,
            "provider": "stock",
            "mass": {
                "empty": 10.5,
                "full": 42.5
            },
            "stackable": {
                "top": "2",
                "bottom": false
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 300,
                    "Thrust": 2000
                },
                {
                    "atmo": 1,
                    "ISP": 280,
                    "Thrust": 1866.6667
                },
                {
                    "atmo": 9,
                    "ISP": 0.001,
                    "Thrust": 0.0067
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Size3AdvancedEngine",
            "name": "Kerbodyne KR-2L+ \"Rhino\" Liquid Fuel Engine",
            "tech": "veryHeavyRocketry",
            "cost": 25000,
            "provider": "stock",
            "mass": {
                "empty": 9,
                "full": 9
            },
            "stackable": {
                "top": "3",
                "bottom": "3"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 340,
                    "Thrust": 2000
                },
                {
                    "atmo": 1,
                    "ISP": 205,
                    "Thrust": 1205.8824
                },
                {
                    "atmo": 5,
                    "ISP": 0.001,
                    "Thrust": 0.0059
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Size3EngineCluster",
            "name": "S3 KS-25x4 \"Mammoth\" Liquid Fuel Engine",
            "tech": "veryHeavyRocketry",
            "cost": 39000,
            "provider": "stock",
            "mass": {
                "empty": 15,
                "full": 15
            },
            "stackable": {
                "top": "3",
                "bottom": false
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 315,
                    "Thrust": 4000
                },
                {
                    "atmo": 1,
                    "ISP": 295,
                    "Thrust": 3746.0317
                },
                {
                    "atmo": 12,
                    "ISP": 0.001,
                    "Thrust": 0.0127
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "ionEngine",
            "name": "IX-6315 \"Dawn\" Electric Propulsion System",
            "tech": "ionPropulsion",
            "cost": 8000,
            "provider": "stock",
            "mass": {
                "empty": 0.25,
                "full": 0.25
            },
            "stackable": {
                "top": "0",
                "bottom": "0"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 4200,
                    "Thrust": 2
                },
                {
                    "atmo": 1,
                    "ISP": 100,
                    "Thrust": 0.0476
                },
                {
                    "atmo": 1.2,
                    "ISP": 0.001,
                    "Thrust": 0
                }
            ],
            "conso": [
                "XenonGas"
            ]
        },
        {
            "id": "smallRadialEngine",
            "name": "24-77 \"Twitch\" Liquid Fuel Engine",
            "tech": "precisionPropulsion",
            "cost": 400,
            "provider": "stock",
            "mass": {
                "empty": 0.09,
                "full": 0.09
            },
            "stackable": {
                "top": false,
                "bottom": false
            },
            "is_radial": true,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 290,
                    "Thrust": 16
                },
                {
                    "atmo": 1,
                    "ISP": 250,
                    "Thrust": 13.7931
                },
                {
                    "atmo": 7,
                    "ISP": 0.001,
                    "Thrust": 0.0001
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "liquidEngineMini",
            "name": "48-7S \"Spark\" Liquid Fuel Engine",
            "tech": "propulsionSystems",
            "cost": 240,
            "provider": "stock",
            "mass": {
                "empty": 0.1,
                "full": 0.1
            },
            "stackable": {
                "top": "0",
                "bottom": "0"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 320,
                    "Thrust": 20
                },
                {
                    "atmo": 1,
                    "ISP": 270,
                    "Thrust": 16.875
                },
                {
                    "atmo": 7,
                    "ISP": 0.001,
                    "Thrust": 0.0001
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "toroidalAerospike",
            "name": "T-1 Toroidal Aerospike \"Dart\" Liquid Fuel Engine",
            "tech": "hypersonicFlight",
            "cost": 3850,
            "provider": "stock",
            "mass": {
                "empty": 1,
                "full": 1
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 340,
                    "Thrust": 180
                },
                {
                    "atmo": 1,
                    "ISP": 290,
                    "Thrust": 153.5294
                },
                {
                    "atmo": 5,
                    "ISP": 230,
                    "Thrust": 121.7647
                },
                {
                    "atmo": 10,
                    "ISP": 170,
                    "Thrust": 90
                },
                {
                    "atmo": 20,
                    "ISP": 0.001,
                    "Thrust": 0.0005
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "microEngine",
            "name": "LV-1 \"Ant\" Liquid Fuel Engine",
            "tech": "propulsionSystems",
            "cost": 110,
            "provider": "stock",
            "mass": {
                "empty": 0.02,
                "full": 0.02
            },
            "stackable": {
                "top": "0",
                "bottom": "0"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 315,
                    "Thrust": 2
                },
                {
                    "atmo": 1,
                    "ISP": 80,
                    "Thrust": 0.5079
                },
                {
                    "atmo": 3,
                    "ISP": 0.001,
                    "Thrust": 0
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "radialEngineMini",
            "name": "LV-1R \"Spider\" Liquid Fuel Engine",
            "tech": "precisionPropulsion",
            "cost": 120,
            "provider": "stock",
            "mass": {
                "empty": 0.02,
                "full": 0.02
            },
            "stackable": {
                "top": false,
                "bottom": false
            },
            "is_radial": true,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 290,
                    "Thrust": 2
                },
                {
                    "atmo": 1,
                    "ISP": 260,
                    "Thrust": 1.7931
                },
                {
                    "atmo": 8,
                    "ISP": 0.001,
                    "Thrust": 0
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "liquidEngine3",
            "name": "LV-909 \"Terrier\" Liquid Fuel Engine",
            "tech": "advRocketry",
            "cost": 390,
            "provider": "stock",
            "mass": {
                "empty": 0.5,
                "full": 0.5
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 345,
                    "Thrust": 60
                },
                {
                    "atmo": 1,
                    "ISP": 85,
                    "Thrust": 14.7826
                },
                {
                    "atmo": 3,
                    "ISP": 0.001,
                    "Thrust": 0.0002
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "nuclearEngine",
            "name": "LV-N \"Nerv\" Atomic Rocket Motor",
            "tech": "nuclearPropulsion",
            "cost": 10000,
            "provider": "stock",
            "mass": {
                "empty": 3,
                "full": 3
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 800,
                    "Thrust": 60
                },
                {
                    "atmo": 1,
                    "ISP": 185,
                    "Thrust": 13.875
                },
                {
                    "atmo": 2,
                    "ISP": 0.001,
                    "Thrust": 0.0001
                }
            ],
            "conso": [
                "LiquidFuel"
            ]
        },
        {
            "id": "liquidEngine",
            "name": "LV-T30 \"Reliant\" Liquid Fuel Engine",
            "tech": "generalRocketry",
            "cost": 1100,
            "provider": "stock",
            "mass": {
                "empty": 1.25,
                "full": 1.25
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 310,
                    "Thrust": 240
                },
                {
                    "atmo": 1,
                    "ISP": 265,
                    "Thrust": 205.1613
                },
                {
                    "atmo": 7,
                    "ISP": 0.001,
                    "Thrust": 0.0008
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "liquidEngine2",
            "name": "LV-T45 \"Swivel\" Liquid Fuel Engine",
            "tech": "basicRocketry",
            "cost": 1200,
            "provider": "stock",
            "mass": {
                "empty": 1.5,
                "full": 1.5
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 320,
                    "Thrust": 215
                },
                {
                    "atmo": 1,
                    "ISP": 250,
                    "Thrust": 167.9688
                },
                {
                    "atmo": 6,
                    "ISP": 0.001,
                    "Thrust": 0.0007
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "liquidEngine1-2",
            "name": "RE-M3 \"Mainsail\" Liquid Fuel Engine",
            "tech": "heavierRocketry",
            "cost": 13000,
            "provider": "stock",
            "mass": {
                "empty": 6,
                "full": 6
            },
            "stackable": {
                "top": "2",
                "bottom": "2"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 310,
                    "Thrust": 1500
                },
                {
                    "atmo": 1,
                    "ISP": 285,
                    "Thrust": 1379.0323
                },
                {
                    "atmo": 9,
                    "ISP": 0.001,
                    "Thrust": 0.0048
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "radialLiquidEngine1-2",
            "name": "Mk-55 \"Thud\" Liquid Fuel Engine",
            "tech": "advRocketry",
            "cost": 820,
            "provider": "stock",
            "mass": {
                "empty": 0.9,
                "full": 0.9
            },
            "stackable": {
                "top": false,
                "bottom": false
            },
            "is_radial": true,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 305,
                    "Thrust": 120
                },
                {
                    "atmo": 1,
                    "ISP": 275,
                    "Thrust": 108.1967
                },
                {
                    "atmo": 9,
                    "ISP": 0.001,
                    "Thrust": 0.0004
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "liquidEngine2-2",
            "name": "RE-L10 \"Poodle\" Liquid Fuel Engine",
            "tech": "heavyRocketry",
            "cost": 1300,
            "provider": "stock",
            "mass": {
                "empty": 1.75,
                "full": 1.75
            },
            "stackable": {
                "top": "2",
                "bottom": "2"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 350,
                    "Thrust": 250
                },
                {
                    "atmo": 1,
                    "ISP": 90,
                    "Thrust": 64.2857
                },
                {
                    "atmo": 3,
                    "ISP": 0.001,
                    "Thrust": 0.0007
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "SSME",
            "name": "S3 KS-25 \"Vector\" Liquid Fuel Engine",
            "tech": "veryHeavyRocketry",
            "cost": 18000,
            "provider": "stock",
            "mass": {
                "empty": 4,
                "full": 4
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 315,
                    "Thrust": 1000
                },
                {
                    "atmo": 1,
                    "ISP": 295,
                    "Thrust": 936.5079
                },
                {
                    "atmo": 12,
                    "ISP": 0.001,
                    "Thrust": 0.0032
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "engineLargeSkipper",
            "name": "RE-I5 \"Skipper\" Liquid Fuel Engine",
            "tech": "heavyRocketry",
            "cost": 5300,
            "provider": "stock",
            "mass": {
                "empty": 3,
                "full": 3
            },
            "stackable": {
                "top": "2",
                "bottom": "2"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 320,
                    "Thrust": 650
                },
                {
                    "atmo": 1,
                    "ISP": 280,
                    "Thrust": 568.75
                },
                {
                    "atmo": 6,
                    "ISP": 0.001,
                    "Thrust": 0.002
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "RAPIER",
            "name": "CR-7 R.A.P.I.E.R. Engine",
            "tech": "aerospaceTech",
            "cost": 6000,
            "provider": "stock",
            "mass": {
                "empty": 2,
                "full": 2
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 305,
                    "Thrust": 180
                },
                {
                    "atmo": 1,
                    "ISP": 275,
                    "Thrust": 162.2951
                },
                {
                    "atmo": 9,
                    "ISP": 0.001,
                    "Thrust": 0.0006
                }
            ],
            "conso": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "solidBooster1-1",
            "name": "BACC \"Thumper\" Solid Fuel Booster",
            "tech": "generalRocketry",
            "cost": 850,
            "provider": "stock",
            "mass": {
                "empty": 1.5,
                "full": 7.65
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 210,
                    "Thrust": 300
                },
                {
                    "atmo": 1,
                    "ISP": 175,
                    "Thrust": 250
                },
                {
                    "atmo": 6,
                    "ISP": 0.001,
                    "Thrust": 0.0014
                }
            ],
            "conso": [
                "SolidFuel"
            ]
        },
        {
            "id": "solidBooster",
            "name": "RT-10 \"Hammer\" Solid Fuel Booster",
            "tech": "basicRocketry",
            "cost": 400,
            "provider": "stock",
            "mass": {
                "empty": 0.75,
                "full": 3.5625
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 195,
                    "Thrust": 227
                },
                {
                    "atmo": 1,
                    "ISP": 170,
                    "Thrust": 197.8974
                },
                {
                    "atmo": 7,
                    "ISP": 0.001,
                    "Thrust": 0.0012
                }
            ],
            "conso": [
                "SolidFuel"
            ]
        },
        {
            "id": "solidBooster_sm",
            "name": "RT-5 \"Flea\" Solid Fuel Booster",
            "tech": "start",
            "cost": 200,
            "provider": "stock",
            "mass": {
                "empty": 0.45,
                "full": 1.5
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 165,
                    "Thrust": 192
                },
                {
                    "atmo": 1,
                    "ISP": 140,
                    "Thrust": 162.9091
                },
                {
                    "atmo": 6,
                    "ISP": 0.001,
                    "Thrust": 0.0012
                }
            ],
            "conso": [
                "SolidFuel"
            ]
        },
        {
            "id": "sepMotor1",
            "name": "Sepratron I",
            "tech": "precisionPropulsion",
            "cost": 75,
            "provider": "stock",
            "mass": {
                "empty": 0.0125,
                "full": 0.0725
            },
            "stackable": {
                "top": false,
                "bottom": false
            },
            "is_radial": true,
            "curve": [
                {
                    "atmo": 0,
                    "ISP": 154,
                    "Thrust": 18
                },
                {
                    "atmo": 1,
                    "ISP": 118,
                    "Thrust": 13.7922
                },
                {
                    "atmo": 6,
                    "ISP": 0.001,
                    "Thrust": 0.0001
                }
            ],
            "conso": [
                "SolidFuel"
            ]
        }
    ];
Parts.fuelTanks = [
        {
            "id": "NCSAdapter",
            "name": "NCS Adapter",
            "tech": "aerodynamicSystems",
            "cost": 320,
            "provider": "stock",
            "mass": {
                "empty": 0.1,
                "full": 0.5
            },
            "stackable": {
                "top": "0",
                "bottom": "1"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel"
            ]
        },
        {
            "id": "R11External",
            "name": "R-11 'Baguette' External Tank",
            "tech": "propulsionSystems",
            "cost": 50,
            "provider": "stock",
            "mass": {
                "empty": 0.03375,
                "full": 0.30375
            },
            "stackable": {
                "top": false,
                "bottom": false
            },
            "is_radial": true,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "R4External",
            "name": "R-4 'Dumpling' External Tank",
            "tech": "precisionPropulsion",
            "cost": 50,
            "provider": "stock",
            "mass": {
                "empty": 0.01375,
                "full": 0.12375
            },
            "stackable": {
                "top": false,
                "bottom": false
            },
            "is_radial": true,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "R12",
            "name": "R-12 'Doughnut' External Tank",
            "tech": "precisionPropulsion",
            "cost": 147,
            "provider": "stock",
            "mass": {
                "empty": 0.0375,
                "full": 0.3375
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "FL_R1",
            "name": "FL-R1 RCS Fuel Tank",
            "tech": "advFuelSystems",
            "cost": 1800,
            "provider": "stock",
            "mass": {
                "empty": 0.4,
                "full": 3.4
            },
            "stackable": {
                "top": "2",
                "bottom": "2"
            },
            "is_radial": false,
            "ressources": [
                "MonoPropellant"
            ]
        },
        {
            "id": "FL_R10",
            "name": "FL-R10 RCS Fuel Tank",
            "tech": "advFuelSystems",
            "cost": 200,
            "provider": "stock",
            "mass": {
                "empty": 0.02,
                "full": 0.1
            },
            "stackable": {
                "top": "0",
                "bottom": "0"
            },
            "is_radial": false,
            "ressources": [
                "MonoPropellant"
            ]
        },
        {
            "id": "FL_R25",
            "name": "FL-R25 RCS Fuel Tank",
            "tech": "advFuelSystems",
            "cost": 330,
            "provider": "stock",
            "mass": {
                "empty": 0.08,
                "full": 0.56
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "ressources": [
                "MonoPropellant"
            ]
        },
        {
            "id": "StratusVRound",
            "name": "Stratus-V Roundified Monopropellant Tank",
            "tech": "advFlightControl",
            "cost": 200,
            "provider": "stock",
            "mass": {
                "empty": 0.02,
                "full": 0.1
            },
            "stackable": {
                "top": false,
                "bottom": false
            },
            "is_radial": true,
            "ressources": [
                "MonoPropellant"
            ]
        },
        {
            "id": "StratusVCylinder",
            "name": "Stratus-V Cylindrified Monopropellant Tank",
            "tech": "specializedControl",
            "cost": 250,
            "provider": "stock",
            "mass": {
                "empty": 0.03,
                "full": 0.23
            },
            "stackable": {
                "top": false,
                "bottom": false
            },
            "is_radial": true,
            "ressources": [
                "MonoPropellant"
            ]
        },
        {
            "id": "X200_16",
            "name": "Rockomax X200-16 Fuel Tank",
            "tech": "fuelSystems",
            "cost": 1550,
            "provider": "stock",
            "mass": {
                "empty": 1,
                "full": 9
            },
            "stackable": {
                "top": "2",
                "bottom": "2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "X200_32",
            "name": "Rockomax X200-32 Fuel Tank",
            "tech": "fuelSystems",
            "cost": 3000,
            "provider": "stock",
            "mass": {
                "empty": 2,
                "full": 18
            },
            "stackable": {
                "top": "2",
                "bottom": "2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "X200_64",
            "name": "Rockomax Jumbo-64 Fuel Tank",
            "tech": "advFuelSystems",
            "cost": 5750,
            "provider": "stock",
            "mass": {
                "empty": 4,
                "full": 36
            },
            "stackable": {
                "top": "2",
                "bottom": "2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "X200_8",
            "name": "Rockomax X200-8 Fuel Tank",
            "tech": "fuelSystems",
            "cost": 800,
            "provider": "stock",
            "mass": {
                "empty": 0.5,
                "full": 4.5
            },
            "stackable": {
                "top": "2",
                "bottom": "2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "S3_14400",
            "name": "Kerbodyne S3-14400 Tank",
            "tech": "highPerformanceFuelSystems",
            "cost": 13000,
            "provider": "stock",
            "mass": {
                "empty": 9,
                "full": 81
            },
            "stackable": {
                "top": "3",
                "bottom": "3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "S3_7200",
            "name": "Kerbodyne S3-7200 Tank",
            "tech": "largeVolumeContainment",
            "cost": 6500,
            "provider": "stock",
            "mass": {
                "empty": 4.5,
                "full": 40.5
            },
            "stackable": {
                "top": "3",
                "bottom": "3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "S3_3600",
            "name": "Kerbodyne S3-3600 Tank",
            "tech": "largeVolumeContainment",
            "cost": 3250,
            "provider": "stock",
            "mass": {
                "empty": 2.25,
                "full": 20.25
            },
            "stackable": {
                "top": "3",
                "bottom": "3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Mk3_Mk2",
            "name": "Mk3 to Mk2 Adapter",
            "tech": "experimentalAerodynamics",
            "cost": 2200,
            "provider": "stock",
            "mass": {
                "empty": 1.43,
                "full": 11.43
            },
            "stackable": {
                "top": "mk2",
                "bottom": "mk3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Mk3_Size2",
            "name": "Mk3 to 2.5m Adapter",
            "tech": "heavyAerodynamics",
            "cost": 2500,
            "provider": "stock",
            "mass": {
                "empty": 1.79,
                "full": 14.29
            },
            "stackable": {
                "top": "2",
                "bottom": "mk3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Mk3_Size2Slant",
            "name": "Mk3 to 2.5m Adapter Slanted",
            "tech": "heavyAerodynamics",
            "cost": 2500,
            "provider": "stock",
            "mass": {
                "empty": 1.79,
                "full": 14.29
            },
            "stackable": {
                "top": "2",
                "bottom": "mk3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Size2_Size1",
            "name": "C7 Brand Adapter - 2.5m to 1.25m",
            "tech": "advFuelSystems",
            "cost": 800,
            "provider": "stock",
            "mass": {
                "empty": 0.57,
                "full": 4.57
            },
            "stackable": {
                "top": "1",
                "bottom": "2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Size2_Size1Slant",
            "name": "C7 Brand Adapter Slanted - 2.5m to 1.25m",
            "tech": "advFuelSystems",
            "cost": 800,
            "provider": "stock",
            "mass": {
                "empty": 0.57,
                "full": 4.57
            },
            "stackable": {
                "top": "1",
                "bottom": "2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Mk3_Size3",
            "name": "Mk3 to 3.75m Adapter",
            "tech": "experimentalAerodynamics",
            "cost": 2500,
            "provider": "stock",
            "mass": {
                "empty": 1.79,
                "full": 14.29
            },
            "stackable": {
                "top": "mk3",
                "bottom": "3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "OscarB",
            "name": "Oscar-B Fuel Tank",
            "tech": "propulsionSystems",
            "cost": 70,
            "provider": "stock",
            "mass": {
                "empty": 0.025,
                "full": 0.225
            },
            "stackable": {
                "top": "0",
                "bottom": "0"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "FL_T100",
            "name": "FL-T100 Fuel Tank",
            "tech": "basicRocketry",
            "cost": 150,
            "provider": "stock",
            "mass": {
                "empty": 0.0625,
                "full": 0.5625
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "FL_T200",
            "name": "FL-T200 Fuel Tank",
            "tech": "generalRocketry",
            "cost": 275,
            "provider": "stock",
            "mass": {
                "empty": 0.125,
                "full": 1.125
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "FL_T400",
            "name": "FL-T400 Fuel Tank",
            "tech": "advRocketry",
            "cost": 500,
            "provider": "stock",
            "mass": {
                "empty": 0.25,
                "full": 2.25
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "FL_T800",
            "name": "FL-T800 Fuel Tank",
            "tech": "fuelSystems",
            "cost": 800,
            "provider": "stock",
            "mass": {
                "empty": 0.5,
                "full": 4.5
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "mk0",
            "name": "Mk0 Liquid Fuel Fuselage",
            "tech": "aviation",
            "cost": 200,
            "provider": "stock",
            "mass": {
                "empty": 0.025,
                "full": 0.275
            },
            "stackable": {
                "top": "0",
                "bottom": "0"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel"
            ]
        },
        {
            "id": "Size1_Mk2Long",
            "name": "Mk2 to 1.25m Adapter Long",
            "tech": "highAltitudeFlight",
            "cost": 1050,
            "provider": "stock",
            "mass": {
                "empty": 0.57,
                "full": 4.57
            },
            "stackable": {
                "top": "1",
                "bottom": "mk2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Size1_Mk2",
            "name": "Mk2 to 1.25m Adapter",
            "tech": "supersonicFlight",
            "cost": 550,
            "provider": "stock",
            "mass": {
                "empty": 0.29,
                "full": 2.29
            },
            "stackable": {
                "top": "1",
                "bottom": "mk2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Mk2LongLFO",
            "name": "Mk2 Rocket Fuel Fuselage",
            "tech": "highAltitudeFlight",
            "cost": 1450,
            "provider": "stock",
            "mass": {
                "empty": 0.57,
                "full": 4.57
            },
            "stackable": {
                "top": "mk2",
                "bottom": "mk2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Mk2LongLF",
            "name": "Mk2 Liquid Fuel Fuselage",
            "tech": "highAltitudeFlight",
            "cost": 1450,
            "provider": "stock",
            "mass": {
                "empty": 0.57,
                "full": 4.57
            },
            "stackable": {
                "top": "mk2",
                "bottom": "mk2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel"
            ]
        },
        {
            "id": "Mk2ShortLFO",
            "name": "Mk2 Rocket Fuel Fuselage Short",
            "tech": "supersonicFlight",
            "cost": 750,
            "provider": "stock",
            "mass": {
                "empty": 0.29,
                "full": 2.29
            },
            "stackable": {
                "top": "mk2",
                "bottom": "mk2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Mk2ShortLF",
            "name": "Mk2 Liquid Fuel Fuselage Short",
            "tech": "supersonicFlight",
            "cost": 750,
            "provider": "stock",
            "mass": {
                "empty": 0.29,
                "full": 2.29
            },
            "stackable": {
                "top": "mk2",
                "bottom": "mk2"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel"
            ]
        },
        {
            "id": "Mk2ShortMono",
            "name": "Mk2 Monopropellant Tank",
            "tech": "highAltitudeFlight",
            "cost": 750,
            "provider": "stock",
            "mass": {
                "empty": 0.29,
                "full": 1.89
            },
            "stackable": {
                "top": "mk2",
                "bottom": "mk2"
            },
            "is_radial": false,
            "ressources": [
                "MonoPropellant"
            ]
        },
        {
            "id": "mk3LongLFO",
            "name": "Mk3 Rocket Fuel Fuselage Long",
            "tech": "experimentalAerodynamics",
            "cost": 10000,
            "provider": "stock",
            "mass": {
                "empty": 7.14,
                "full": 57.14
            },
            "stackable": {
                "top": "3",
                "bottom": "3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "mk3ShortLFO",
            "name": "Mk3 Rocket Fuel Fuselage Short",
            "tech": "experimentalAerodynamics",
            "cost": 2500,
            "provider": "stock",
            "mass": {
                "empty": 1.79,
                "full": 14.29
            },
            "stackable": {
                "top": "3",
                "bottom": "3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "mk3LFO",
            "name": "Mk3 Rocket Fuel Fuselage",
            "tech": "experimentalAerodynamics",
            "cost": 5000,
            "provider": "stock",
            "mass": {
                "empty": 3.57,
                "full": 28.57
            },
            "stackable": {
                "top": "3",
                "bottom": "3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel",
                "Oxidizer"
            ]
        },
        {
            "id": "Mk3LongLF",
            "name": "Mk3 Liquid Fuel Fuselage Long",
            "tech": "experimentalAerodynamics",
            "cost": 17200,
            "provider": "stock",
            "mass": {
                "empty": 7.14,
                "full": 57.14
            },
            "stackable": {
                "top": "3",
                "bottom": "3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel"
            ]
        },
        {
            "id": "Mk3LongLF",
            "name": "Mk3 Liquid Fuel Fuselage Short",
            "tech": "heavyAerodynamics",
            "cost": 4300,
            "provider": "stock",
            "mass": {
                "empty": 1.79,
                "full": 14.29
            },
            "stackable": {
                "top": "3",
                "bottom": "3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel"
            ]
        },
        {
            "id": "Mk3LF",
            "name": "Mk3 Liquid Fuel Fuselage",
            "tech": "heavyAerodynamics",
            "cost": 8600,
            "provider": "stock",
            "mass": {
                "empty": 3.57,
                "full": 28.57
            },
            "stackable": {
                "top": "3",
                "bottom": "3"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel"
            ]
        },
        {
            "id": "Mk3MONO",
            "name": "Mk3 Monopropellant Tank",
            "tech": "experimentalAerodynamics",
            "cost": 5040,
            "provider": "stock",
            "mass": {
                "empty": 1.4,
                "full": 9.8
            },
            "stackable": {
                "top": "3",
                "bottom": "3"
            },
            "is_radial": false,
            "ressources": [
                "MonoPropellant"
            ]
        },
        {
            "id": "PB_X150",
            "name": "PB-X150 Xenon Container",
            "tech": "ionPropulsion",
            "cost": 3680,
            "provider": "stock",
            "mass": {
                "empty": 0.024,
                "full": 0.096
            },
            "stackable": {
                "top": "0",
                "bottom": "0"
            },
            "is_radial": false,
            "ressources": [
                "XenonGas"
            ]
        },
        {
            "id": "PB_X750",
            "name": "PB-X750 Xenon Container",
            "tech": "ionPropulsion",
            "cost": 24300,
            "provider": "stock",
            "mass": {
                "empty": 0.19,
                "full": 0.76
            },
            "stackable": {
                "top": "0",
                "bottom": "0"
            },
            "is_radial": false,
            "ressources": [
                "XenonGas"
            ]
        },
        {
            "id": "PB_X50R",
            "name": "PB-X50R Xenon Container",
            "tech": "ionPropulsion",
            "cost": 2220,
            "provider": "stock",
            "mass": {
                "empty": 0.0135,
                "full": 0.054
            },
            "stackable": {
                "top": false,
                "bottom": false
            },
            "is_radial": true,
            "ressources": [
                "XenonGas"
            ]
        },
        {
            "id": "MK1Fuselage",
            "name": "Mk1 Liquid Fuel Fuselage",
            "tech": "aviation",
            "cost": 550,
            "provider": "stock",
            "mass": {
                "empty": 0.25,
                "full": 2.25
            },
            "stackable": {
                "top": "1",
                "bottom": "1"
            },
            "is_radial": false,
            "ressources": [
                "LiquidFuel"
            ]
        }
    ];