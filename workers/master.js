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

// Refresh Temporary Results Stack & event listener
function cleanData() {
    Global_data = {};
    RocketsStack = [];

    RocketsStack.push = function (e) {
        Array.prototype.push.call(RocketsStack, e);
        self.dispatchEvent(new CustomEvent('StackPush'));
    };

    RocketsStack.shift = function (e) {
        var output = Array.prototype.shift.call(RocketsStack, e);
        if (output === undefined && RocketsStack.length === 0) {
            self.dispatchEvent(new CustomEvent('StackIsEmpty'));
        }
        return output;
    };
}

// Wait for another pull of data to process
function autostop() {
    cleanData();
    var stopped = new Date();
    DEBUG.send('Master # wait # ' + round((stopped - startTime) / 1000, 0) + "sec running");
    self.postMessage({ channel: 'wait', id: 'Master' });
}

// Delete me
function killMe() {
    if (Object.values(WorkersStatus).join('') === '') {
        DEBUG.send('Master # killMe');
        self.postMessage({ channel: 'killMe', id: 'Master' });
        cleanData();
        Parts = {};
        close();
    }
}

// Stop All Children
function SendStopToAllChildren() {
    for (var i in Workers) {
        if (Workers[i] !== undefined) {
            Workers[i].postMessage({ channel: "stop" });
        }
    }
}

// Communication
self.addEventListener('message', function (e) {
    var inputs = e.data;
    if (inputs.channel === 'stop') {
        Global_status = 'stop';
        DEBUG.send('Master # to stop');
        SendStopToAllChildren();
        return;
    }

    if (inputs.channel === 'create') {
        Parts = inputs.parts;
        DEBUG.setStatus(inputs.debug.status);
        DEBUG.setStart(inputs.debug.startTime);
        DEBUG.send('Master # created');
        return;
    }

    if (inputs.channel === 'run') {
        cleanData();
        Global_data = inputs.data;
        startTime = new Date();
        DEBUG.send('Master # run');
        run();
        return;
    }
});

// Processing functions
function run() {
    // Generate Workers
    if (WorkersCreated === false) {
        WorkersCreated = true;
        MakeWorkers();
    }

    // Generate fist group of stages
    WorkersStatus['Worker--0'] = 'reserved';

    // Make data for UpperStage
    var UpperData = clone(Global_data);
    UpperData.originData = {};
    UpperData.originData.AllDv = Global_data.rocket.dv;

    // Send Data to Worker
    WorkersStatus['Worker--0'] = 'run';
    Workers['Worker--0'].postMessage({ channel: 'run', data: UpperData  });
}

// Make Worker Collections
function MakeWorkers() {
    var i = 0;
    while(i < Global_data.simu.nbWorker) {
        // Prepare worker id
        var worker_uid = 'Worker--' + i;

        // Init Worker
        WorkersStatus[worker_uid] = 'created';
        var w = new Worker('getStage.js');
        DEBUG.send('Generate woker ' + worker_uid);
        Workers[worker_uid] = w;

        // Add listener on worker
        w.addEventListener('message', function (e) {
            var channel = e.data.channel;
            var sub_worker_id = e.data.id;
            if (channel == 'badDesign') {
                self.postMessage({ channel: 'badDesign' });
            }
            if (channel === 'killMe') {
                Workers[sub_worker_id] = undefined;
                WorkersStatus[sub_worker_id] = '';
                killMe();
            }
            if (channel === 'wait') {
                WorkersStatus[sub_worker_id] = 'wait';
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
        });

        // Send create signal 
        w.postMessage({ channel: 'create', id: worker_uid, parts: Parts, debug: Global_data.simu.debug });

        // Next worker
        i++;
    }
}

// When a Stack are pushed on tmp
self.addEventListener('StackPush', function () {

    DEBUG.send('# Master RocketsStack length # ' + RocketsStack.length);

    for (var sub_worker_id in Workers) {
        if (WorkersStatus[sub_worker_id] === 'wait' || WorkersStatus[sub_worker_id] === 'created') {
            WorkersStatus[sub_worker_id] = 'reserved';
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

    DEBUG.send('# Master RocketsStack is Empty');

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
    var Stack = RocketsStack.shift();

    // If stack are empty, check if all calculation ended
    if (Stack === undefined) {
        VerifyAutostop();
        return;
    }

    // Stack are usable
    // Make data for UpperStage
    var UpperData = clone(Stack);
    UpperData.originData = {};
    UpperData.originData.AllDv = Global_data.rocket.dv;
    UpperData.stack = null;

    // Send Data to Worker
    Workers[sub_worker_id] = 'run';
    Workers[sub_worker_id].postMessage({ channel: 'run', data: UpperData  });
}

/******************/
/** End condition */
/******************/

// control if with need autostop
function VerifyAutostop() {
    var nbRunning = 0;
    for (var sub_worker_id in WorkersStatus) {
        if (WorkersStatus[sub_worker_id] === 'run') {
            nbRunning++;
        }
    }

    if (nbRunning === 0) {
        // Normal Stopping
        autostop();
    }
}
