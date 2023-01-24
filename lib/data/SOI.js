// List of SOI
const SOI = {
    kerbin:
        {
            Name: "Kerbin",
            Go: 9.81,
            LowOrbitDv: 3400,
            groundPressure: 1,
            KermanLine: 70000,
            atmosphere: // alt : m  =>, pressure : atm
                [
                    {alt: 0, p: 1.000},
                    {alt: 2500, p: 0.681},
                    {alt: 5000, p: 0.450},
                    {alt: 7500, p: 0.287},
                    {alt: 10000, p: 0.177},
                    {alt: 15000, p: 0.066},
                    {alt: 20000, p: 0.025},
                    {alt: 25000, p: 0.010},
                    {alt: 30000, p: 0.004},
                    {alt: 40000, p: 0.001},
                    {alt: 50000, p: 0.000},
                    {alt: 60000, p: 0.000},
                    {alt: 70000, p: 0.000},
                ],
        },
    mun:
        {
            Name: "Mun",
            Go: 1.63,
            LowOrbitDv: 540,
            groundPressure: 0,
            KermanLine: 0,
            atmosphere: // alt : m  =>, pressure : atm
                [
                    {alt: 0, p: 0},
                ]
        }
};