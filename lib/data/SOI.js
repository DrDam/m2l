
"use strict";

/**
 * List of SOI
 *
 * Format :
 *
 * SOI = {
 *     SOI_id: {
 *         Name: "SOI name",
 *         Go: [numeric], // Standard Gravity Value on ground (m/s²).
 *         BasicMissionDv: [numeric] // Standard Dv needed for a standard basic mission from ground (m/s)
 *         atmosphere: [
 *             {
 *               alt: [numeric], // Altitude of the point (m)
 *               p: [numeric] // Atmospheric pressure on this point (atm)
 *             }*
 *         ]
 *     }
 * }
 */
const SOI = {
    kerbin:
        {
            Name: "Kerbin",
            Go: 9.81,
            BasicMissionDv: 3400,
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
            BasicMissionDv: 540,
            atmosphere: // alt : m  =>, pressure : atm
                [
                    {alt: 0, p: 0},
                ]
        }
};