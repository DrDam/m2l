importScripts('../lib/lib.js');
if (typeof Worker === 'undefined') {
    // Load subworker only if browser not support natively
    importScripts("../lib/subworkers.js");
}

// Worker ID
var worker_id;

// Computation data / status
var Global_data = {};
var Parts = {};
var Global_status = 'run';
var startTime = new Date();

// Worker Stacks

// Refresh Temporary Result Stack & event launcher
function cleanData() {

    Global_data = {};
}

// Wait for another pull of data to process
function autostop() {
    cleanData();
    var stopped = new Date();
    DEBUG.send(worker_id + ' # wait # ' + round((stopped - startTime) / 1000, 0) + "sec running");
    self.postMessage({ channel: 'wait', id: worker_id });
}

// Delete me
function killMe() {
        DEBUG.send(worker_id + ' # killMe');
        self.postMessage({ channel: 'killMe', id: worker_id });
        cleanData();
        Parts = {};
        close();
}

// Stop All Children
function SendStopToAllChildren() {

}


// Communication
self.addEventListener('message', function (e) {
    var inputs = e.data;
    if (inputs.channel === 'stop') {
        Global_status = 'stop';
        DEBUG.send(worker_id + ' # to stop');
        SendStopToAllChildren();
        return;
    }

    if (inputs.channel === 'create') {
        worker_id = inputs.id;
        Parts = inputs.parts;
        DEBUG.setStatus(inputs.debug.status);
        DEBUG.setStart(inputs.debug.startTime);
        DEBUG.send(worker_id + ' # created');
        return;
    }

    if (inputs.channel === 'init') {
        cleanData();
        Global_data = inputs.data;
        startTime = new Date();
        DEBUG.send(worker_id + ' # init');
        return;
    }

    if (inputs.channel === 'run') {
        DEBUG.send(worker_id + ' # run');
        drawMeRockets();
        return;
    }
});

// Processing functions
function drawMeRockets() {
    //console.log(data);
}
