importScripts('../lib/lib.js');
/******************/
/* Init Variables */
/******************/
let startTime = new Date();

// Main worker data
let Parts = {};
let Global_status = 'wait';
let stagesStack = {};
let twr = {};
let SOI = {};
let nb = 0;
self.addEventListener('message', function (e) {
    let inputs = e.data;

    // I'm a newborn, Master give me a name & feed me with collection of parts.
    if (inputs.channel === 'create') {
        DEBUG.setStatus(inputs.debug);
        DEBUG.setStart(startTime);
        Global_status = 'create'
        Parts = inputs.parts;
        twr = inputs.twr;
        SOI = inputs.soi;
        DEBUG.send('Generate Stages # created');
    }

    if (inputs.channel === 'run') {
        DEBUG.send('Generate Stages # start');
        run();
    }

    // I'm a newborn, Master give me a name & feed me with collection of parts.
    if (inputs.channel === 'stop') {
        Global_status = 'stop';
        Global_data = undefined;
        Parts = undefined;
        close();
    }
});

function run() {

    makeStage();

    sortStages();

    self.postMessage({ channel: 'results', results: stagesStack});

}

function makeStage() {

    // For each engines
    loopEngine:
    for (let engineKey in Parts.engines) {

        // Intercept Stop
        if (Global_status === 'stop') {
            return null;
        }

        let engine = Parts.engines[engineKey];

        // If engine mass is too heavy.
        let maxMass = getMaxMassInVacuum(engine, twr, SOI)
        if(maxMass < engine.mass.full) {
            continue;
        }

        // Engine is self fueled and not radial
        let MEngineFuel = engine.mass.full - engine.mass.empty
        if(MEngineFuel > 0 && !engine.is_radial) {
            processStage(clone(engine));
        }

        let fuelType = engine.conso.sort().join('--');

        // No tanks stack for this ressource or sizes
        if (Parts.fuelable[fuelType] === undefined ||
            (!engine.is_radial && Parts.fuelable[fuelType][engine.stackable.top] === undefined)
        )
        {
            // Next engine
            continue;
        }

        let FuelableStack = [];
        // If engine is radial, disable filter in engineTopSize
        if (engine.is_radial) {
            for (let sizebottom in Parts.fuelable[fuelType]){
                FuelableStack = FuelableStack.concat(Parts.fuelable[fuelType][sizebottom]);
            }
        }
        else {
            FuelableStack = Parts.fuelable[fuelType][engine.stackable.top]
        }

        for (let tankKey in FuelableStack) {

            // Intercept Stop
            if (Global_status === 'stop') {
                return null;
            }

            let Mt = engine.mass.full + FuelableStack[tankKey].info.mass.full

            // If engine + fuel are too heavy.
            if(maxMass < Mt) {
                continue loopEngine;
            }

            processStage(clone(engine), clone(FuelableStack[tankKey]));
        }
    }
}

function processStage(engine, fuelStack) {

    let topsize = engine.stackable.top;

    // Build stage data from engine
    let stage = {
        cost: engine.cost,
        curve: engine.curve,
        mass: engine.mass,
        parts: {
            engine: engine.parts
        },
        //provider: [stageParts.engine.provider],
       // techs: [stageParts.engine.tech],
        stackable: {
            top: engine.stackable.top,
            bottom: engine.stackable.bottom,
        },
        nb: engine.nb
    }

    // Correct data with fuelStack
    if(fuelStack !== undefined) {

        // manage stackable
        topsize = fuelStack.info.stackable.top;
        stage.stackable.top = fuelStack.info.stackable.top;

        if(engine.is_radial) {
            stage.stackable.bottom  = fuelStack.info.stackable.bottom;
        }

        stage.parts.fuelStack = fuelStack.parts;
        stage.cost = round(stage.cost + fuelStack.info.cost);
        stage.nb = round(stage.nb + fuelStack.info.nb);

        stage.mass.full = round(stage.mass.full + fuelStack.info.mass.full);
        stage.mass.empty = round(stage.mass.empty + fuelStack.info.mass.empty);
        //      stage.provider = stage.provider.concat(stageParts.fuelStack.info.provider);
        //      stage.techs = stage.techs.concat(stageParts.fuelStack.info.techs);

    }

    // Add Stage to stack.
    if(stagesStack[topsize] === undefined) {
        stagesStack[topsize] = {};
    }
    if(stagesStack[topsize][engine.id] === undefined) {
        stagesStack[topsize][engine.id] = [];
    }
    stagesStack[topsize][engine.id].push(stage);

    nb++;
    self.postMessage({ channel: 'nb', nb: nb});
}


function sortStages() {
    for (let size in stagesStack) {
        for (let engine_id in stagesStack[size]) {
            stagesStack[size][engine_id] = sortSageByMass(stagesStack[size][engine_id]);
        }
    }
}

function sortSageByMass(array)
{
    return array.sort(function(a, b)
    {
        var x = a.mass.full; var y = b.mass.full;
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}
