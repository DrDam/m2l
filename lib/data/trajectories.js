
"use strict";

/**
 * List of Trajectories
 *
 * Format :
 *
 * trajectories = {
 *     SOI_id: { // reference to a SOI in SOI.js
 *         Trajectory_id: {
 *             name: "Trajectory name",
 *             steps: [
 *                 {
 *                   dv: [numeric],  // Dv used from ground to this point (m/s)
 *                   alt: [numeric], // Reached Altitude of the point (m)
 *                   twrReduction: [numeric] // How many can we reduice min/max twr (%)
 *                 }*
 *             ]
 *         }
 *     }
 * }
 */
const trajectories = {
    kerbin: {
        basic: {
            name: "basic ground to 70km orbit",
            steps: [
                { dv: 0,  alt: 0, twrReduction: 0},
                { dv: 400, alt: 10000, twrReduction: 10},
                { dv: 1000, alt: 20000, twrReduction: 50},
                { dv: 2500, alt: 50000, twrReduction: 66},
            ]
        }
    }
};