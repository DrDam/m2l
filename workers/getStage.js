importScripts('../lib/lib.js');
var startTime = new Date();

// Main worker data
var worker_id;
var Global_data = {};
var Parts = {};
var Global_status = 'run';

// EngineStack
var EnginesStack = [];

// FuelStackWorkers Status
var FuelStackWorkers = {};
var FuelStackWorkersStatus = {};
var FuelStackWorkersCreated = false;

// Wait for another pull of data to process
function autostop() {
    cleanData();
    var stopped = new Date();
    DEBUG.send(worker_id + ' # wait # ' + round((stopped - startTime) / 1000, 0) + "sec running");
    self.postMessage({ channel: 'wait', id: worker_id });
}

// Delete me
function killMe() {
    if (Object.values(FuelStackWorkersStatus).join('') === '') {
        DEBUG.send(worker_id + ' # killMe');
        self.postMessage({ channel: 'killMe', id: worker_id });
        cleanData();
        Parts = {};
        close();
    }
}

// Refresh Temporary Results Stack & event listener
function cleanData() {
    Global_data = {};
    EnginesStack = [];

    EnginesStack.push = function (e) {
        Array.prototype.push.call(EnginesStack, e);
        self.dispatchEvent(new CustomEvent('StackPush'));
    };

    EnginesStack.shift = function (e) {
        var output = Array.prototype.shift.call(EnginesStack, e);
        if (output === undefined && EnginesStack.length === 0) {
            self.dispatchEvent(new CustomEvent('StackIsEmpty'));
        }
        return output;
    };
}

// Stop All Children
function SendStopToAllChildren() {
    for (var i in FuelStackWorkers) {
        if (FuelStackWorkers[i] !== undefined) {
            FuelStackWorkers[i].postMessage({ channel: "stop" });
        }
    }
}


// Communication
self.addEventListener('message', function (e) {
    var inputs = e.data;
    if (inputs.channel == 'stop') {
        Global_status = 'stop';
        DEBUG.send(worker_id + ' # to stop');
        SendStopToAllChildren();
    }

    if (inputs.channel == 'create') {
        DEBUG.setStatus(inputs.debug.status);
        DEBUG.setStart(inputs.debug.startTime);
        worker_id = inputs.id;
        Parts = inputs.parts;
        DEBUG.send(worker_id + ' # created');
    }

    if (inputs.channel == 'run') {
        cleanData();
        Global_data = inputs.data;
        //console.log(Global_data);
        startTime = new Date();
        DEBUG.send(worker_id + ' # run');
        drawMeStages();
        return;
    }
});

// Processing functions
function drawMeStages() {

    // Create fuelStackWorker
    if(FuelStackWorkersCreated == false) {
        initFuelStackWorker();
    }

    // Make Calculations
    giveMeAllSingleStage();
}

// Make Worker Collections
function initFuelStackWorker() {
    var i = 0;
    while(i < Global_data.simu.nbWorker) {
        // Prepare worker id
        var worker_uid = worker_id + '--FuelStack--' + i;

        // Init Worker
        FuelStackWorkersStatus[worker_uid] = 'created';
        var w = new Worker('getFuelStacks.js');
        DEBUG.send('Generate woker ' + worker_uid);
        FuelStackWorkers[worker_uid] = w;

        // Add listener on worker
        w.addEventListener('message', WorkerEventListener);

        // Send create signal 
        w.postMessage({ channel: 'create', id: worker_uid, parts: Parts, debug: Global_data.simu.debug });

        // Next worker
        i++;
    }
}

// Set Event Listener On worker
function WorkerEventListener(e) {
    var channel = e.data.channel;
    var sub_worker_id = e.data.id;
    if (channel == 'badDesign') {
        self.postMessage({ channel: 'badDesign' });
    }
    if (channel === 'killMe') {
        FuelStackWorkers[sub_worker_id] = undefined;
        FuelStackWorkersStatus[sub_worker_id] = '';
        killMe();
    }
    if (channel === 'wait') {
        FuelStackWorkersStatus[sub_worker_id] = 'wait';
        // Continue calculation
        generateStageStack(sub_worker_id);
    }
    if (channel === 'result') {
        DEBUG.send(sub_worker_id + ' # send Result');
        var result = e.data;
        //  Manage results
        
        // If DeltaV & TWR ok => push to front

        // Else => push to stack
        /*RocketsStack.push({
            output: e.data.output,
            data: e.data.data
        });*/
        console.log(result);
    }
}

function giveMeAllSingleStage() {

    var targetDv = Global_data.rocket.dv;
    var twr = Global_data.rocket.twr;
    var SOI = Global_data.SOI;
    var cu = Global_data.cu;
    
    var restDvAfterEnd = (Global_data.stack != null) ? Global_data.originData.AllDv - Global_data.stack.dv : Global_data.originData.AllDv;
    var AtmPressurAtEnd = AtmPressurEstimator(restDvAfterEnd);

    // Add decoupler mass
    var decoupler = {};
    decoupler = getDecoupler(cu.size);
    if (decoupler === null) {
        decoupler = {};
        decoupler.mass = {};
        decoupler.mass.full = 0;
        decoupler.name = '';
        decoupler.cost = 0;
    }

    // Add commandModule if needed
    var command = { mass: 0, stack: [], nb:0, cost:0 };

    // What to do :
    // 1: estimate Atm condition on "end" of engine => DvAll - DvNexStage
    // => if > 3400 => vacum
    // => else => estimate atm condition
    // 2: Controle TWR 
    // => if < TWR taget for atm condition => next engine
    // => else : estimate empty fuel mass possible
    // 3: Generate all fuel stack with empty mass < max empty mass 
    // => foreach
    // => => 3.0 : if massFuelStackEmpty > max empty mass => next stack
    // => => 3.1 : calculate Dv on "end condition"
    // => => 3.2 : estimate atm condition on "starting engine" => DvAll - DvNexStage - DvStage
    // => => 3.3 : calculate new TWR on start and max fuel mass possible
    // => => 3.4 : if massFuelStack > MaxMass => next stack
    // => => 3.5 : calculate Dv of stack
    // => => 3.6 : return Stage

    // Limit on Twin-Boar for test
    //Parts.engines = [Parts.engines[11]];

    engineLoop:
    for (var i in Parts.engines) {

        // Intercept Stop
        if (Global_status == 'stop') {
            return null;
        }

        var engine = Parts.engines[i];

        // Prepare Masses values
        var MassEngineFull = engine.mass.full;
        var MassEngineDry = engine.mass.empty;
        var MstageDry = cu.mass + decoupler.mass.full + command.mass + MassEngineDry;
        var MstageFull = cu.mass + decoupler.mass.full + command.mass + MassEngineFull;

        var curveData = getCaractForAtm(engine.curve, AtmPressurAtEnd);
        var ISP = curveData.ISP;
        var Thrust = curveData.Thrust;

        if(!testTwr(Thrust, MstageDry, twr, SOI.Go, AtmPressurAtEnd)) {
            console.log('=>  OUT not enought TWR on empty for ' + engine.name );
            self.postMessage({ channel: 'badDesign' });
            continue engineLoop;
        }

        // Manage solid Boosters
        if (engine.conso[0] == 'SolidFuel') {
            // No fuel tack possible

            var Dv = ISP * SOI.Go * Math.log(MstageFull / MstageDry);
            var Dv_before_burn = restDvAfterEnd - Dv;
            var AtmPressurBeforeBurn = AtmPressurEstimator(Dv_before_burn);

            if(!testTwr(Thrust, MstageFull, twr, SOI.Go, AtmPressurBeforeBurn)) {
                console.log('=>  OUT not enought TWR on fuel for booster ' + engine.name );
                self.postMessage({ channel: 'badDesign' });
                continue engineLoop;
            }

            var stage = make_stage(AtmPressurBeforeBurn, engine, command, decoupler, null);
            self.postMessage({ channel: 'result', stage: stage, id: worker_id, data: Global_data });
            continue engineLoop;
        }

        // add Engine to Engine Stack
        var data_to_calculation = {
            cu: cu,
            engine: engine,
            command: command,
            decoupler: decoupler,
            SOI: SOI,
            restDvAfterEnd: restDvAfterEnd,
            twr: Global_data.rocket.twr,
            max: Global_data.simu.maxTanks
        };
        EnginesStack.push(data_to_calculation);
    }
}
       
// When a Stack are pushed on tmp
self.addEventListener('StackPush', function () {

    DEBUG.send('# '+worker_id+' EnginesStack length # ' + EnginesStack.length);

    for (var sub_worker_id in FuelStackWorkers) {
        if (FuelStackWorkersStatus[sub_worker_id] === 'wait' || FuelStackWorkersStatus[sub_worker_id] === 'created') {
            FuelStackWorkersStatus[sub_worker_id] = 'reserved';
            generateStageStack(sub_worker_id);
        }
    }
});

// Signal end of all processing
self.addEventListener('StackIsEmpty', function () {
    if (Global_status === 'stop') {
        SendStopToAllChildren();
        return;
    }

    DEBUG.send('# '+worker_id+' EnginesStack is Empty');

    // If there is nothing to compute, verify if end are possible
    VerifyAutostop();
});

// Main calculation function
function generateStageStack(sub_worker_id) {
    // Intercept Stop command
    if (Global_status === 'stop') {
        SendStopToAllChildren();
        return;
    }

    // Get new element
    var Stack = EnginesStack.shift();

    // If stack are empty, check if all calculation ended
    if (Stack === undefined) {
        VerifyAutostop();
        return;
    }

    // Send Data to Worker
    FuelStackWorkersStatus[sub_worker_id] = 'run';
    FuelStackWorkers[sub_worker_id].postMessage({ channel: 'run', data: clone(Stack)  });
}

/******************/
/** End condition */
/******************/

// control if with need autostop
function VerifyAutostop() {
    var nbRunning = 0;
    for (var sub_worker_id in FuelStackWorkersStatus) {
        if (FuelStackWorkersStatus[sub_worker_id] === 'run') {
            nbRunning++;
        }
    }

    if (nbRunning === 0) {
        // Normal Stopping
        autostop();
    }
}

/************/
/* Helpers */
/**********/

// Get a Decoupler
function getDecoupler(size) {
    for (var i in Parts.decouplers) {
        var decoupler = Parts.decouplers[i];
        if (decoupler.size == size) {
            return decoupler;
        }
    }
    return null;
}

function make_stage(atm, engine, command, decoupler, fuelStack) {

    if(fuelStack == null) {
        fuelStack = {};
        fuelStack.mass = {};
        fuelStack.mass.full = 0;
        fuelStack.mass.empty = 0;
        fuelStack.cost = 0;
        fuelStack.nb = 0;
        fuelStack.solution = [];
    }

    var curveData = getCaractForAtm(engine.curve, atm);
    var ISP = curveData.ISP;
    var Thrust = curveData.Thrust;

    // Make stage caracterics
    MstageFull = Global_data.cu.mass + engine.mass.full + fuelStack.mass.full;
    MstageDry = Global_data.cu.mass + engine.mass.empty + fuelStack.mass.empty;
    EngineFuelMass = engine.mass.full - engine.mass.empty;
    var stageFuelMass = fuelStack.mass.full - fuelStack.mass.empty + EngineFuelMass;
    var TwrFull = Thrust / MstageFull / Global_data.SOI.Go;
    var TwrDry = Thrust / MstageDry / Global_data.SOI.Go;
    var burnDuration = stageFuelMass * ISP * Global_data.SOI.Go / Thrust;
    var Dv = ISP * Global_data.SOI.Go * Math.log(MstageFull / MstageDry);
    var cost = engine.cost + decoupler.cost + command.cost + fuelStack.cost;
    var nb = engine.nb + 1 + command.nb + fuelStack.solution.length;
    var stage = {
        decoupler: decoupler.name,
        commandModule: command.stack,
        tanks: fuelStack.solution,
        engine: engine.name,
        twr: {
            min: TwrFull,
            max: TwrDry
        },
        mass: {
            full: MstageFull,
            empty: MstageDry,
        },
        burn: burnDuration,
        stageDv: Dv,
    };
    var output = {
        stages: [stage],
        totalMass: stage.mass.full,
        burn: stage.burn,
        stageDv: Dv,
        nbStages: 1,
        cost: cost,
        nb:nb,
        size: engine.stackable.bottom
    };

    return output;
}