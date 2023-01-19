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

    // Simu parameters
    let TankFuelRatio = 8;
    let twrCorrection = twr.step;
    let AcceptedPerformanceSpread = 3;

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
     * 1: Estimate Atm on Ignition
     *   1.0 : if SOI groundPressure == 0 => do nothing, all ready in vaccum
     *   1.1 : Calculate possible Dv from ground (with TWR & atm = SOI.groundPressure) => Dv0
     *   1.2 : Estimate Atm condition on ignition of engine => DvAll - Dv0 => atm0
     *   1.3 : If DvAll - Dv0 < SOI.LowOrbitDv => atm = vacuum, else redo
     *           Else ReCalculate on possible Dv from atm0 condition (with adjusted TWR) => DvAtm0
     *           ( DvAtm0 > Dv0 => because atm0 < SOI.groundPressure)
     *           If  DvAll - DvAtm0 > SOI.LowOrbitDv => atm = vacuum.
     *             Else Estimate condition on ignition of engine => DvAll - DvAtm0 => atm
     *   1.4 : define TWR adjusted to atm => MfuelMax
     * 2 : Foreach TankStack
     *   2.1 : check if tank.mass.full = MfuelMax +- AcceptedPerformanceSpread % => BadId
     *   2.2 : check size (size.top == decoupler.size && size.bottom = engine.size)
     *   2.3 : check fuel type (tank.ressources == engine.conso)
     *   2.4 : Calculate real Dv & TWR with this TankStack and check TWR +- AcceptedPerformanceSpread %
     *   2.5 : if all Ok => format Stack & return to master
     */

    for (let engineKey in Parts.engines) {

        // Intercept Stop
        if (Global_status === 'stop') {
            return null;
        }

        let engine = Parts.engines[engineKey];
        //DEBUG.send(worker_id + ' # test Engine ' + engine.name);
        let Mdead = decoupler.mass.full + command.mass + rocket_cu.mass + engine.mass.empty;
        let MEngineFuel = engine.mass.full - engine.mass.empty

        // Preparation for SolidFuel Engines => non fuel tanks will be avalaibles.
        let StageMDry = Mdead;
        let StageMFull = StageMDry + MEngineFuel;

        // 1. Estimate Atm on Ignition
        let ignitionPressure;
        if (SOI.groundPressure === 0) {
            ignitionPressure = 0;
        } else {
            // 1.1 : Calculate Possible Dv from ground => Dv0
            let curveData = getCaractForAtm(engine.curve, SOI.groundPressure);
            let ISP = curveData.ISP;
            let Thrust = curveData.Thrust;
            let Mtot = Thrust / twr.min / SOI.Go;

            let Mfuel = (Mtot - Mdead - MEngineFuel) * (TankFuelRatio / (TankFuelRatio + 1)) ;
            let Dv0 = ISP * SOI.Go * Math.log(Mtot / (Mtot - Mfuel));

            // 1.2 : Estimate Atm condition on ignition of engine => DvAll - Dv0 => atm0
            if (rocket_dv_target - Dv0 > SOI.LowOrbitDv) {
                ignitionPressure = 0;
            } else {

                // 1.3 : If DvAll - Dv0 > SOI.LowOrbitDv redo calculation
                let atm0 = AtmPressurEstimator(rocket_dv_target - Dv0, SOI);
                // Redo calculation
                let curveData = getCaractForAtm(engine.curve, atm0);
                let correctTwr = TwrCorrection(atm0, SOI, twr);
                let ISP = curveData.ISP;
                let Thrust = curveData.Thrust;

                let Mtot = Thrust / correctTwr / SOI.Go;
                let Mfuel = (Mtot - Mdead - MEngineFuel) * TankFuelRatio / (TankFuelRatio + 1);

                let DvAtm0 = ISP * SOI.Go * Math.log(Mtot / (Mtot - Mfuel));

                // 1.2 : Estimate Atm condition on ignition of engine => DvAll - Dv0 => atm0
                if (rocket_dv_target - DvAtm0 > SOI.LowOrbitDv) {
                    ignitionPressure = 0;
                } else {
                    ignitionPressure = AtmPressurEstimator(rocket_dv_target - DvAtm0, SOI);
                }
            }
        }

        //DEBUG.send(worker_id + ' # test Engine ' + engine.name + ' # ignition pressure : ' + ignitionPressure);

        // 1.4 : define TWR adjusted to atm => MfuelMax
        let curveDataIngition = getCaractForAtm(engine.curve, ignitionPressure);
        let correctTwrAtIgnition = TwrCorrection(ignitionPressure, SOI, twr);
        let ThrustOnIgnition = curveDataIngition.Thrust;
        let Mtot = ThrustOnIgnition / correctTwrAtIgnition / SOI.Go;
        let MmaxFuelTanks = Mtot - Mdead - MEngineFuel;

        // In case of engine self-contained fuel like SolidBooster or twinboar.
        if(MEngineFuel > 0) {
            // 2.3 : Calculate real Dv & TWR with this TankStack and check TWR +- AcceptedPerformanceSpread %
            StageMFull = Mdead + MEngineFuel;
            let StageTwr = ThrustOnIgnition / StageMFull / SOI.Go;

            // Check TWR
            if (StageTwr > twr.min - (AcceptedPerformanceSpread / 100)
                &&
                (twr.max !== undefined || StageTwr < twr.max + (AcceptedPerformanceSpread / 100))
            ) {
                // Make stack info & return to master
                let stage = make_stage_item(ignitionPressure, engine, command, decoupler);
                return_staging(stage);
            }
        }

        // If a fuel tank are needed.
        if(MmaxFuelTanks > 0) {

            // 2. Foreach TankStack
            for (let tankKey in Parts.fuelable) {

                // Intercept Stop
                if (Global_status === 'stop') {
                    return null;
                }

                let tankStack = Parts.fuelable[tankKey];


                // 2.3 : check fuel type (tank.ressources == engine.conso)
                if (tankStack.info.ressources.join('-') !== engine.conso.join('-')) {
                   continue;
                }

                // 2.1 : check size (size.top == decoupler.size && size.bottom = engine.size)
                if (
                    tankStack.info.stackable.top !== decoupler.size
                    ||
                    (!engine.is_radial && tankStack.info.stackable.bottom !== engine.stackable.top)
                ) {
                    continue;
                }

                // 2.3 : Calculate real Dv & TWR with this TankStack and check TWR +- AcceptedPerformanceSpread %
                let StackFuel = tankStack.info.mass.full - tankStack.info.mass.empty;
                StageMDry = Mdead + tankStack.info.mass.empty;
                StageMFull = StageMDry + MEngineFuel + StackFuel;
                let StageTwr = ThrustOnIgnition / StageMFull / SOI.Go;

                // Check TWR
                if (StageTwr < twr.min - (AcceptedPerformanceSpread / 100)
                    ||
                    (twr.max !== undefined && StageTwr > twr.max + (AcceptedPerformanceSpread / 100))
                ) {
                    continue;
                }

                // Make stack info & return to master
                let stage = make_stage_item(ignitionPressure, engine, command, decoupler, tankStack);
                return_staging(stage);
            }
        }
        else {
            // Engine not have enougth trust in current conditions, or he produces to many Dv for current situation
            self.postMessage({ channel: 'badDesign' });
        }
    }

    // Ended all stack passes
    autoStop();
}


/************/
/* Helpers */
/**********/

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
function make_stage_item(start_stage_atm, engine, command, decoupler, fuelStack) {

    if (fuelStack == null) {
        fuelStack = {};
        fuelStack.info = {};
        fuelStack.info.mass = {};
        fuelStack.info.mass.full = 0;
        fuelStack.info.mass.empty = 0;
        fuelStack.info.cost = 0;
        fuelStack.info.nb = 0;
    }

    let curveData = getCaractForAtm(engine.curve, start_stage_atm);
    let ISP = curveData.ISP;
    let Thrust = curveData.Thrust;

    // Make stage caracterics
    let MstageFull = round(Global_data.cu.mass + decoupler.mass.full + command.mass + engine.mass.full + fuelStack.info.mass.full, 4);
    let MstageDry = round(Global_data.cu.mass + decoupler.mass.empty + command.mass + engine.mass.empty + fuelStack.info.mass.empty, 4);
    let EngineFuelMass = engine.mass.full - engine.mass.empty;
    let stageFuelMass = fuelStack.info.mass.full - fuelStack.info.mass.empty + EngineFuelMass;
    let TwrFull = round(Thrust / MstageFull / Global_data.SOI.Go);
    let TwrDry = round(Thrust / MstageDry / Global_data.SOI.Go);
    let burnDuration = round(stageFuelMass * ISP * Global_data.SOI.Go / Thrust);
    let Dv = round(ISP * Global_data.SOI.Go * Math.log(MstageFull / MstageDry));
    let cost = engine.cost + decoupler.cost + command.cost + fuelStack.info.cost;
    let nb = engine.nb + 1 + command.nb + fuelStack.info.nb;

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
            bottom: engine.stackable.bottom
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