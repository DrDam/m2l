importScripts('../lib/models.js','../lib/lib.js');

/******************/
/* Init Variables */
/******************/
let startTime = new Date();

// Main worker data
let Global_data = {};
let Parts = {};
let Global_status = 'run';
let worker_id;

/*********************/
/* Utility functions */
/*********************/

/**
 * Refresh Temporary Results Stack & event listener
 */
function cleanData() {
    Global_data = {};
}

/**
 * Calculation ended, waiting for a new work.
 */
function autoStop() {
    cleanData();
    let stopped = new Date();
    DEBUG.send(worker_id + ' # wait # ' + round((stopped - startTime) / 1000, 0) + "sec running");
    // Send message to master script, I'm waiting.
    self.postMessage({ channel: 'wait', id: worker_id });
}

/**
 * Messages from Master.
 */
self.addEventListener('message', function (e) {
    let inputs = e.data;

    // I'm a newborn, Master give me a name & feed me with collection of parts.
    if (inputs.channel === 'create') {
        DEBUG.setStatus(inputs.debug.status);
        DEBUG.setStart(inputs.debug.startTime);
        worker_id = inputs.id;
        Parts = inputs.parts;
        DEBUG.send(worker_id + ' # created');
        return;
    }

    // Master send me data to process and I go to work.
    if (inputs.channel === 'run') {
        cleanData();
        Global_data = inputs.data;
        // console.log(Global_data);
        startTime = new Date();
        DEBUG.send(worker_id + ' # run');
        run();
        return;
    }

    // Master doesn't need me anymore so I can disappear.
    if (inputs.channel === 'stop') {
        DEBUG.send(worker_id + ' # killMe');
        self.postMessage({ channel: 'killMe', id: worker_id });
        // Clear data.
        Global_data = null;
        // clear worker
        close();
    }
});

/**
 * Start processing.
 */
function run() {
    // Rocket data
    let rocket_cu = Global_data.cu;

    // Add a decoupler
    let decoupler = {};
    decoupler = getDecoupler(rocket_cu.size);

    if (decoupler === null) {
        // Maybe a "couille dans le potage", isn't it ?
        decoupler = {};
        decoupler.mass = {};
        decoupler.mass.full = 0;
        decoupler.name = '';
        decoupler.cost = 0;
    }

    // Add commandModule
    // @TODO : when adding a "provide fuel for return"
    let command = {mass: 0, stack: [], nb: 0, cost: 0};

    let StageData = {};
    StageData.decoupler = decoupler;
    StageData.command = command;

    /**
     * How I meet your Stage ?
     */

    // If no stages for this size.
    if(Parts.stages[rocket_cu.size] === undefined) {
        return;
    }

    loopEngine:
    for (let enginekey in Parts.stages[rocket_cu.size]) {

        // console.log(Parts.stages[rocket_cu.size][enginekey].length);
        for (let stageKey in Parts.stages[rocket_cu.size][enginekey]) {

            // Intercept Stop
            if (Global_status === 'stop') {
                return null;
            }

            let stage = Parts.stages[rocket_cu.size][enginekey][stageKey];

            let StageMDry = decoupler.mass.full + command.mass + rocket_cu.mass + stage.mass.empty;
            let MEngineFuel = stage.mass.full - stage.mass.empty
            let StageMFull = StageMDry + MEngineFuel;

            // If "stage + CU" mass is now too high for engine, change engine.
            let maxMass = getMaxMassInVacuum(stage, Global_data.rocket.twr, Global_data.SOI);
            if (StageMFull > maxMass) {
                continue loopEngine;
            }

            if (Global_data.rocket.max !== undefined) {
                // If Mass are to low so TWR > TWRmax in GroundSOI
                let minMass = getMinMassInSOI(stage, Global_data.rocket.twr, Global_data.SOI);
                if (StageMFull < minMass) {
                    continue;
                }
            }

            // Add stage to stack.
            StageData.stage = stage;

            // Process without fuel Tank.
            let validatedStage = trytoMakeStage(StageData, Global_data.SOI, StageMFull, StageMDry, Global_data.rocket.dv.target, Global_data.rocket.twr);
            if (validatedStage === false) {
                self.postMessage({channel: 'badDesign'});
            } else {
                return_staging(validatedStage);
            }
        }
    }

    // Ended all stack passes
    autoStop();
}

/************/
/* Helpers */
/**********/

/**
 * Try to find the "most probable atmospheric pressure" on stage Ignition
 */
function getIgnitionPressure(SOI, engineCurve, Mtot, Mdry, DvTarget) {

    if (SOI.groundPressure === 0) {
        return 0;
    }
    else {
        let ignitionPressure = SOI.groundPressure;
        for (let i = 0; i <= 5; i++) {
            ignitionPressure = calculateIgnitionPressure(ignitionPressure, engineCurve, SOI, Mtot, Mdry, DvTarget);
        }

        // Calculate Dv produice in engine ignition
        let curveDataIgnition = getCaractForAtm(engineCurve, ignitionPressure);
        let DvIgnition = curveDataIgnition.ISP * SOI.Go * Math.log(Mtot / Mdry);

        // Estimate Atm condition on ignition of engine => DvAll - DvIgnition => atm0
        if (DvTarget - DvIgnition > SOI.LowOrbitDv) {
            return 0;
        } else {
            return AtmPressurEstimator(DvTarget - DvIgnition, SOI);

        }
    }
}

/**
 * Try to estimate a more "probable" atmospheric pressure one engine ignition.
 */
function calculateIgnitionPressure(localPressure, engineCurve, SOI, Mtot, Mdry, dvTarget) {
    // Get ISP from local pressure
    let curveDataOnGround = getCaractForAtm(engineCurve, localPressure);
    // Get Theorical Dv in this local pressure
    let Dv0 = curveDataOnGround.ISP * SOI.Go * Math.log(Mtot / Mdry);
    // Estimate local pressure on ignition
    let atmPressureIgnition = AtmPressurEstimator(dvTarget - Dv0, SOI);

    // Return mean between the two
    return (atmPressureIgnition + localPressure) /2
}

/**
 * Test if an engin/tank stack are capable, and format it.
 */
function trytoMakeStage(StageData, SOI, Mtot, Mdry, DvTarget, twr) {

    let engineCurve = StageData.stage.curve;

    // We have ignition parameters. This Engine + FuelStar can flight ?
    let ignitionPressure = getIgnitionPressure(SOI, engineCurve, Mtot, Mdry, DvTarget);
    let curveDataIgnition = getCaractForAtm(engineCurve, ignitionPressure);
    let twrIgnition = curveDataIgnition.Thrust / SOI.Go / Mtot;

    // Check TWR
    if (twrIgnition < twr.min - (twr.spread / 100)
        ||
        (twr.max !== undefined && twrIgnition > twr.max + (twr.spread / 100))
    ) {
        return false;
    }
    else {
        return make_stage_item(ignitionPressure, StageData);
    }
}


/**
 * Get a decoupler.
 */
function getDecoupler(size) {
    for (let i in Parts.decouplers) {
        let decoupler = Parts.decouplers[i];
        if (decoupler.size === size) {
            return decoupler;
        }
    }
    return null;
}
/**
 * Properly format stage
 */
function make_stage_item(start_stage_atm, StageData) {

    //console.log(StageData);
    let stage = StageData.stage;
    let engine = stage.parts.engine;
    let command = StageData.command;
    let decoupler = StageData.decoupler;
    let fuelStack = stage.parts.fuelStack;

    if (fuelStack == null) {
        fuelStack = {};
        fuelStack.parts = [];
    }

    let curveData = getCaractForAtm(stage.curve, start_stage_atm);
    let ISP = curveData.ISP;
    let Thrust = curveData.Thrust;

    // Make stage caracterics
    let MstageFull = round(Global_data.cu.mass + decoupler.mass.full + command.mass + stage.mass.full, 4);
    let MstageDry = round(Global_data.cu.mass + decoupler.mass.empty + command.mass + stage.mass.empty, 4);
    let stageFuelMass = stage.mass.full - stage.mass.empty;
    let TwrFull = round(Thrust / MstageFull / Global_data.SOI.Go);
    let TwrDry = round(Thrust / MstageDry / Global_data.SOI.Go);
    let burnDuration = round(stageFuelMass * ISP * Global_data.SOI.Go / Thrust);
    let Dv = round(ISP * Global_data.SOI.Go * Math.log(MstageFull / MstageDry));
    let cost = stage.cost + decoupler.cost + command.cost;
    let nb = stage.nb + 1 + command.nb;

    return {
        parts: {
            decoupler: decoupler.name,
            commandModule: command.stack,
            tanks: fuelStack,
            engine: engine,
        },
        caracts: {
            twr: {
                min: TwrFull,
                max: TwrDry
            },
            stageDv: Dv,
            burn: burnDuration,
            nb: nb,
            cost: cost,
            mass: {
                full: round(MstageFull - Global_data.cu.mass),
                empty: round(MstageDry - Global_data.cu.mass),
            },
        },
        size: {
            top: decoupler.size,
            bottom: stage.stackable.bottom
        },
    };

}

/**
 * Return a result to Master
 */
function return_staging(stage) {
    let data = {};
    data.info = {};
    data.info.dv = 0;
    // if 1 stage (nearest of the payload), create stagging.
    if( Global_data.stages === undefined ) {
        data.stages = [];
    }
    else {
        data.stages = clone(Global_data.stages);
        for (let stagesKey in data.stages) {
            data.info.dv = round( data.info.dv + data.stages[stagesKey].caracts.stageDv);
        }
    }

    data.info.target = Global_data.rocket.dv;

    // Add Stage to staging
    data.stages.push(stage);
    data.info.dv = round(data.info.dv + stage.caracts.stageDv);
    data.info.bottomSize = stage.size.bottom;
    data.info.massFull = round(Global_data.cu.mass + stage.caracts.mass.full);

    // Push data to Master.
    self.postMessage({ channel: 'result', output: data, id: worker_id});
}
