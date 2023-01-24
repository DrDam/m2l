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
      //  console.log(Global_data);
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

    // Mission
    let SOI = Global_data.SOI;
    let rocket_dv_target = Global_data.rocket.dv.target;

    // Rocket data
    let twr = Global_data.rocket.twr;
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

    /**
     * How I meet your Engine ?
     *
     * How to :
     * For Each EngineStack
     * * For Each TankStack
     * * * 0 : Ths stack is valid ? Fuel / Size ?
     * * * 1 : Estimate Atm on Ignition
     *     1.0 : if SOI groundPressure == 0 => do nothing, all ready in vaccum
     *     1.1 : Calculate possible Dv from ground (with TWR & atm = SOI.groundPressure) => Dv0
     *     1.2 : Estimate Atm condition on ignition of engine => DvAll - Dv0 => atm0
     *     1.3 : If DvAll - Dv0 < SOI.LowOrbitDv => atm = vacuum, else redo
     *           Else ReCalculate on possible Dv from atm0 condition (with adjusted TWR) => DvAtm0
     *           ( DvAtm0 > Dv0 => because atm0 < SOI.groundPressure)
     *           If  DvAll - DvAtm0 > SOI.LowOrbitDv => atm = vacuum.
     *             Else Estimate condition on ignition of engine => DvAll - DvAtm0 => atm
     *     1.4 : define TWR adjusted to atm => MfuelMax
     *
     * 2 : Foreach TankStack
     *   2.1 : check if tank.mass.full = MfuelMax +- AcceptedPerformanceSpread % => BadId
     *   2.2 : check size (size.top == decoupler.size && size.bottom = engine.size)
     *   2.3 : check fuel type (tank.ressources == engine.conso)
     *   2.4 : Calculate real Dv & TWR with this TankStack and check TWR +- AcceptedPerformanceSpread %
     *   2.5 : if all Ok => format Stack & return to master
     */
    loopEngine:
        for (let engineKey in Parts.engines) {

            // Intercept Stop
            if (Global_status === 'stop') {
                return null;
            }

            let engine = Parts.engines[engineKey];
            //DEBUG.send(worker_id + ' # test Engine ' + engine.name);
            let StageMDry = decoupler.mass.full + command.mass + rocket_cu.mass + engine.mass.empty;
            let MEngineFuel = engine.mass.full - engine.mass.empty
            let StageMFull = StageMDry + MEngineFuel;

            let maxMass = getMaxMassInVacuum(engine, twr, SOI);
            if(StageMFull > maxMass) {
                continue;
            }

            let StageParts = {};
            StageParts.engine = engine;
            StageParts.decoupler = decoupler;
            StageParts.command = command;

            if (MEngineFuel > 0) {

                // Process without fuel Tank
                let stage = trytoMakeStage(StageParts, StageMFull, StageMDry, rocket_dv_target, twr);
                if (stage === false) {
                    self.postMessage({ channel: 'badDesign' });
                }
                else {
                    return_staging(stage);
                }
            }

            let fuel = engine.conso.sort().join('--')

            // No tanks stack for this ressource and sizes
            if (Parts.fuelable[fuel] == undefined ||
                Parts.fuelable[fuel][rocket_cu.size] == undefined ||
                (!engine.is_radial && Parts.fuelable[fuel][rocket_cu.size][engine.stackable.top] == undefined)
            )
                {
                    // Next engine
                    continue;
                }

            let FuelableStack = [];
            // If engine is radial, disable filter in engineTopSize
            if (engine.is_radial) {
                for (let sizebottom in Parts.fuelable[fuel][rocket_cu.size]){
                    FuelableStack = FuelableStack.concat(Parts.fuelable[fuel][rocket_cu.size][sizebottom]);
                }
            }
            else {
                FuelableStack = Parts.fuelable[fuel][rocket_cu.size][engine.stackable.top]
            }

            for (let tankKey in FuelableStack) {

                // Intercept Stop
                if (Global_status === 'stop') {
                    return null;
                }

                let tankStack = FuelableStack[tankKey];

                // This is a stack for a booster, if we're not making a booster, next.
                if(tankStack.only_booster === true && Global_data.rocket !== true) {
                    continue;
                }

                let MtDry = StageMDry + tankStack.mass.empty;
                let MtFull = StageMFull + tankStack.mass.full;

                // Fuel tanks are sort by mass, if it's too heavy, next are too.
                if(MtFull > maxMass) {
                    continue loopEngine;
                }

                StageParts.fuelStack = tankStack;
                // Process stack
                let stage = trytoMakeStage(StageParts, MtFull, MtDry, rocket_dv_target, twr);
                if (stage === false) {
                    self.postMessage({ channel: 'badDesign' });
                    continue;
                }
                else {
                    return_staging(stage);
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
function getIgnitionConditions(engineCurve, Mtot, Mdry, DvTarget) {

    if (Global_data.SOI.groundPressure === 0) {
        return 0;
    }
    else {
        let ignitionPressure = Global_data.SOI.groundPressure;
        for (let i = 0; i <= 5; i++) {
            ignitionPressure = calculateIgnitionPressure(ignitionPressure, engineCurve, Mtot, Mdry, DvTarget);
        }

        // Calculate Dv produice in engine ignition
        let curveDataIgnition = getCaractForAtm(engineCurve, ignitionPressure);
        let DvIgnition = curveDataIgnition.ISP * Global_data.SOI.Go * Math.log(Mtot / Mdry);

        // Estimate local altitude
        let trajectoryState = getTrajectoryState(DvTarget - DvIgnition, Global_data.trajectory);

        // Estimate local pressure
        return {
            pressure : getLocalPressureFromAlt(trajectoryState.alt, Global_data.SOI.atmosphere),
            twrReduction: trajectoryState.twrReduction
        }

    }
}

/**
 * Try to estimate a more "probable" atmospheric pressure & twr reduction.
 */
function calculateIgnitionPressure(localPressure, engineCurve, Mtot, Mdry, dvTarget) {

    // Get ISP from local pressure
    let curveDataOnGround = getCaractForAtm(engineCurve, localPressure);

    // Get Theorical Dv in this local pressure
    let Dv0 = curveDataOnGround.ISP * Global_data.SOI.Go * Math.log(Mtot / Mdry);

    // Estimate local altitude
    let trajectoryState = getTrajectoryState(dvTarget - Dv0, Global_data.trajectory);

    // Estimate local pressure
    let atmPressureIgnition = getLocalPressureFromAlt(trajectoryState.alt, Global_data.SOI.atmosphere);

    // Return mean between the two
    return (atmPressureIgnition + localPressure) /2
}

/**
 * Test if an engin/tank stack are capable, and format it.
 */
function trytoMakeStage(Parts, Mtot, Mdry, DvTarget, twr) {

    let engineCurve = Parts.engine.curve;

    // We have ignition parameters. This Engine + FuelStar can flight ?
    let ignitionConditions = getIgnitionConditions(engineCurve, Mtot, Mdry, DvTarget);

    let curveDataIgnition = getCaractForAtm(engineCurve, ignitionConditions.pressure);
    let twrIgnition = curveDataIgnition.Thrust / Global_data.SOI.Go / Mtot;

    // Check TWR
    if (twrIgnition < reduceTwr(twr.min, ignitionConditions.twrReduction) - (twr.spread / 100)
        ||
        (twr.max !== undefined && twrIgnition > reduceTwr(twr.max, ignitionConditions.twrReduction) + (twr.spread / 100))
    ) {
        // Bad design
        return false;
    }
    else {
        return make_stage_item(ignitionConditions.pressure, Parts);
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
function make_stage_item(start_stage_atm, stackParts) {

    let engine = stackParts.engine;
    let command = stackParts.command;
    let decoupler = stackParts.decoupler;
    let fuelStack = stackParts.fuelStack;

    if (fuelStack == null) {
        fuelStack = {};
        fuelStack.info = {};
        fuelStack.mass = {};
        fuelStack.mass.full = 0;
        fuelStack.mass.empty = 0;
        fuelStack.info.cost = 0;
        fuelStack.nb = 0;
    }

    let curveData = getCaractForAtm(engine.curve, start_stage_atm);
    let ISP = curveData.ISP;
    let Thrust = curveData.Thrust;

    // Make stage caracterics
    let MstageFull = round(Global_data.cu.mass + decoupler.mass.full + command.mass + engine.mass.full + fuelStack.mass.full, 4);
    let MstageDry = round(Global_data.cu.mass + decoupler.mass.empty + command.mass + engine.mass.empty + fuelStack.mass.empty, 4);
    let EngineFuelMass = engine.mass.full - engine.mass.empty;
    let stageFuelMass = fuelStack.mass.full - fuelStack.mass.empty + EngineFuelMass;
    let TwrFull = round(Thrust / MstageFull / Global_data.SOI.Go);
    let TwrDry = round(Thrust / MstageDry / Global_data.SOI.Go);
    let burnDuration = round(stageFuelMass * ISP * Global_data.SOI.Go / Thrust);
    let Dv = round(ISP * Global_data.SOI.Go * Math.log(MstageFull / MstageDry));
    let cost = engine.cost + decoupler.cost + command.cost + fuelStack.info.cost;
    let nb = engine.nb + 1 + command.nb + fuelStack.nb;

    let bottomSize = (engine.is_radial) ? fuelStack.stackable.bottom : engine.stackable.bottom;

    return {
        parts: {
            decoupler: decoupler.name,
            commandModule: command.stack,
            tanks: fuelStack.parts,
            engine: engine.name,
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
            bottom: bottomSize
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
    data.info.massFull = Global_data.cu.mass + stage.caracts.mass.full;

    // Push data to Master.
    self.postMessage({ channel: 'result', output: data, id: worker_id});
}
