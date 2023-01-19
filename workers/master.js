importScripts('../lib/lib.js');
if (typeof Worker === 'undefined') {
    // Load subworker only if browser not support natively
    importScripts("../lib/subworkers.js");
}

/******************/
/* Init Variables */
/******************/

// Computation data / status
var Global_data = {};
var Parts = {};
var Global_status = 'run';
var startTime = new Date();

// Workers Status
var Workers = {};
var WorkersStatus = {};
var WorkersCreated = false;

// Rockets Stacks
var RocketsStack = [];

/*********************/
/* Utility functions */
/*********************/

/**
 * Refresh Temporary Results Stack & event listener
 */
function cleanData() {
    Global_data = {};
    RocketsStack = [];

    // Need to add 2 events on array prototype.

    // Add an event on push : StackPush.
    RocketsStack.push = function (e) {
        Array.prototype.push.call(RocketsStack, e);
        self.dispatchEvent(new CustomEvent('StackPush'));
    };

    // Add an event on shift : StackIsEmpty.
    RocketsStack.shift = function (e) {
        var output = Array.prototype.shift.call(RocketsStack, e);
        if (output === undefined && RocketsStack.length === 0) {
            self.dispatchEvent(new CustomEvent('StackIsEmpty'));
        }
        return output;
    };
}

/**
 * Calculation ended, waiting for a new work.
 */
function autostop() {
    cleanData();
    var stopped = new Date();
    DEBUG.send('Master # wait # ' + round((stopped - startTime) / 1000, 0) + "sec running");
    // Send message to main script, I'm wating.
    self.postMessage({ channel: 'wait', id: 'Master' });
}

/**
 * SubWorkers have been killed, so I can disapear.
 */
function killMe() {
    // If all subworker are killed
    if (Object.values(WorkersStatus).join('') === '') {
        DEBUG.send('Master # killMe');
        // Send message to main script, I will terminated.
        self.postMessage({ channel: 'killMe', id: 'Master' });
        // Clear data.
        cleanData();
        Parts = {};
        // clear worker
        close();
    }
}

/**
 * Send "Stop" message to all subWorkers.
 */
function SendStopToAllChildren() {
    for (var i in Workers) {
        if (Workers[i] !== undefined) {
            Workers[i].postMessage({ channel: "stop" });
        }
    }
}

/**
 * Message from main script.
 */
self.addEventListener('message', function (e) {
    var inputs = e.data;

    // I'm a new born, main script feed me with collection of parts.
    if (inputs.channel === 'create') {
        Parts = inputs.parts;
        DEBUG.setStatus(inputs.debug.status);
        DEBUG.setStart(inputs.debug.startTime);
        DEBUG.send('Master # created');
        return;
    }

    // Main script send me data to process and I go to work.
    if (inputs.channel === 'run') {
        cleanData();
        Global_data = inputs.data;
        startTime = new Date();
        DEBUG.send('Master # run');
        run();
        return;
    }

    // Main script call to stop calculations.
    if (inputs.channel === 'stop') {
        Global_status = 'stop';
        DEBUG.send('Master # to stop');
        SendStopToAllChildren();
        return;
    }
});

/**
 * Main Calculation Function
 */
function run() {

    // If there is no SubWorkers, create they.
    if (WorkersCreated === false) {
        WorkersCreated = true;
        MakeWorkers();
    }

    // Invoke my first born.
    WorkersStatus['Staging--0'] = 'reserved';

    // Clone Data and prepare for first worker.
    var UpperData = clone(Global_data);
    UpperData.originData = {};
    UpperData.originData.AllDv = Global_data.rocket.dv;

    // Make first born as working and push it to work !
    WorkersStatus['Staging--0'] = 'run';
    Workers['Staging--0'].postMessage({ channel: 'run', data: UpperData  });
}

/**
 * Generate my children
 */
function MakeWorkers() {
    var i = 0;
    while(i < Global_data.simu.nbWorker) {

        // Prepare worker id.
        var worker_uid = 'Staging--' + i;

        // Init Worker.
        var w = new Worker('getStaging.js');
        DEBUG.send('Generate woker ' + worker_uid);
        Workers[worker_uid] = w;

        // Add listener with workers.
        w.addEventListener('message', WorkerEventListener);

        // Tag him to created.
        WorkersStatus[worker_uid] = 'created';
        w.postMessage({ channel: 'create', id: worker_uid, parts: Parts, debug: Global_data.simu.debug });

        // Next worker.
        i++;
    }
}

/**
 * How to comunicate with Staging workers.
 * @param Event e
 */
function WorkerEventListener (e) {

    // Decode channel & worker.
    var channel = e.data.channel;
    var sub_worker_id = e.data.id;

    // Worker have tried an BadDesign.
    if (channel == 'badDesign') {
        // Send message to main script.
        self.postMessage({ channel: 'badDesign' });
    }

    // Worker find a good design
    if (channel === 'result') {
        DEBUG.send(sub_worker_id + ' # send Result');
        var result = e.data;

        //  Manage design.
        returnRocket(result.staging);
    }

    // Worker as finished is task, and wait a new one.
    if (channel === 'wait') {
        // Tag it as waiting.
        WorkersStatus[sub_worker_id] = 'wait';

        // Try to find him a new work.
        generateStageStack(sub_worker_id);
    }

    // Worker had been terminated.
    if (channel === 'killMe') {
        // Delete it for management.
        Workers[sub_worker_id] = undefined;
        WorkersStatus[sub_worker_id] = '';

        // Try to terminate myself.
        killMe();
    }
}

/*
 * A stack as been push in the Rockets Stack.
 */
self.addEventListener('StackPush', function () {

    DEBUG.send('# Master RocketsStack length # ' + RocketsStack.length);

    // Find if one woker wait for work.
    for (var sub_worker_id in Workers) {
        if (WorkersStatus[sub_worker_id] === 'wait' || WorkersStatus[sub_worker_id] === 'created') {

            // If one worker are waiting, send it to work.
            WorkersStatus[sub_worker_id] = 'reserved';
            generateStageStack(sub_worker_id);
        }
    }
});

/*
 * The waiting Rocket stack are empty.
 */
self.addEventListener('StackIsEmpty', function () {
    // If main script call to stop, Stop !!!!
    if (Global_status === 'stop') {
        SendStopToAllChildren();
        return;
    }

    DEBUG.send('# Master RocketsStack is Empty');

    // If there is nothing to compute, verify if there is the end.
    VerifyAutostop();
});

/**
 * Send work to a worker
 *
 * @param {int} sub_worker_id
 */
function generateStageStack(sub_worker_id) {
    // If main script call to stop, Stop !!!!
    if (Global_status === 'stop') {
        SendStopToAllChildren();
        return;
    }

    // Get new element from the stack.
    var Stack = RocketsStack.shift();

    // If stack are empty
    if (Stack === undefined) {
        // Check if all calculation are ended.
        VerifyAutostop();
    }
    else {
        // Make data for stage calculation.
        var UpperData = clone(Stack);
        UpperData.originData = {};
        UpperData.originData.AllDv = Global_data.rocket.dv;
        UpperData.stack = null;

        // Send Data to Worker.
        WorkersStatus[sub_worker_id] = 'run';
        Workers[sub_worker_id].postMessage({ channel: 'run', data: UpperData });
    }
}

/**
 * A full rocket are finished
 */
function returnRocket(stages) {

    var rocket = {
        totalMass: 0,
        nb: 0,
        totalDv: 0,
        nbStages: stages.length,
        cost: 0,
        stages: [],
    };

    for(var i in stages) {
        var stage = stages[i];
        rocket.cost += stage.caracts.cost;
        rocket.totalMass += stage.caracts.mass.full;
        rocket.totalDv += stage.caracts.stageDv;
        rocket.nb += stage.caracts.nb;
        rocket.stages.push(stage);
    }

    self.postMessage({channel: 'result', rocket: rocket});

}

/**
 * Natural End Condition.
 */
function VerifyAutostop() {

    var nbRunning = 0;
    // Check all worker if some-one still working.
    for (var sub_worker_id in WorkersStatus) {
        if (WorkersStatus[sub_worker_id] === 'run') {
            nbRunning++;
        }
    }

    // If no one working.
    if (nbRunning === 0) {
        // Normal Stopping.
        autostop();
    }
}
