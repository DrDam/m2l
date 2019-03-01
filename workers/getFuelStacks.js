importScripts('../lib/lib.js');
var startTime = new Date();

// Generate 1 stage Rocket
var worker_id;
var Global_data = {};
var Parts = {};
var Global_status = 'run';
var fragment_id;

function autostop() {
    var stopped = new Date();
    Global_data = null;
    DEBUG.send(worker_id + ' # wait # ' + round((stopped - startTime) / 1000, 0) + "sec running");
    self.postMessage({ channel: 'wait', id: worker_id });
}

function killMe() {
    DEBUG.send(worker_id + ' # killMe');
    self.postMessage({ channel: 'killMe', id: worker_id });
    Global_data = null;
    close();
}

// Communication
self.addEventListener('message', function (e) {
    var inputs = e.data;
    if (inputs.channel == 'stop') {
        Global_status = 'stop';
        DEBUG.send(worker_id + ' # to stop');
        killMe();
    }

    if (inputs.channel == 'create') {
        DEBUG.setStatus(inputs.debug.status);
        DEBUG.setStart(inputs.debug.startTime);
        worker_id = inputs.id;
        Parts = inputs.parts;
        if (inputs.fragment_id != undefined) {
            fragment_id = e.data.fragment_id;
        }
        DEBUG.send(worker_id + ' # created');
    }

    if (e.data.channel == 'run') {
        Global_data = inputs.data;
        startTime = new Date();
        DEBUG.send(worker_id + ' # run');
        run();
        return;
    }
});

// Processing function
function run() {
    generateFuelStacks(null);

    // Add timeout before end
    setTimeout(function () { autostop(); }, 10);
}

function generateFuelStacks(fuelStack) {

    if(fuelStack == null) {
        fuelStack = {};
        fuelStack.mass = {};
        fuelStack.mass.full = 0;
        fuelStack.mass.empty = 0;
        fuelStack.cost = 0;
        fuelStack.nb = 0;
        fuelStack.solution = [];
        fuelStack.bottom = null;
    }

    var EnginesNeeded = Global_data.engine.conso;
    var cu_size = Global_data.cu.size;
    var engine_size = Global_data.engine.stackable.top;
    var AtmPressurAtEnd = AtmPressurEstimator(Global_data.restDvAfterEnd);
    var curveData_after = getCaractForAtm(Global_data.engine.curve, AtmPressurAtEnd);


    for(var id in Parts.fuelable) {
        if (Global_status == 'stop') {
            return null;
        }

        var part = Parts.fuelable[id];

        // Control size (75% out)
        if (
            // First part of the fuelStack
            fuelStack.bottom == null && part.stackable.top != cu_size ||
            // Next part of fuelStack
            fuelStack.bottom != null && part.stackable.top != fuelStack.bottom || 
            // Test bottom on no radial engine
            Global_data.engine.is_radial != true && part.stackable.bottom != engine_size
            ) {
            continue;
        }

        // Control Fuel Type
        if (part.ressources != undefined && !part.ressources.equals(getKeys(EnginesNeeded))) {
            continue;
        }

        // Add part to stack
        var localStack = addPartToStack(fuelStack, part);

        // Calculate TWR & DV
        var MassEngineFull = Global_data.engine.mass.full;
        var MassEngineDry = Global_data.engine.mass.empty;
        var MstageDry = Global_data.cu.mass + Global_data.decoupler.mass.full + Global_data.command.mass + MassEngineDry + localStack.mass.empty;
        var MstageFull = Global_data.cu.mass + Global_data.decoupler.mass.full + Global_data.command.mass + MassEngineFull + localStack.mass.full;

        // Estimation of DV with "after burn" ISP
        var Dv_theo = curveData_after.ISP * Global_data.SOI.Go * Math.log(MstageFull / MstageDry);
        var Dv_before_burn = Global_data.restDvAfterEnd - Dv_theo;

        // Estimation curve "before burn"
        var AtmPressurBerforeBurn = AtmPressurEstimator(Dv_before_burn);
        var curveData_before = getCaractForAtm(Global_data.engine.curve, AtmPressurBerforeBurn);

        // Calculate TWR for beforeBurne condition
        if(!testTwr(curveData_before.Thrust, MstageFull, Global_data.twr, Global_data.SOI.Go, AtmPressurBerforeBurn)) {
            console.log('=> FuelStack to heavy');
            self.postMessage({ channel: 'badDesign' });
            continue ;
        }

        // Calculate Dv for BeforeBurn Conditions
        var Dv_theo_2 = curveData_before.ISP * Global_data.SOI.Go * Math.log(MstageFull / MstageDry);
        self.postMessage({ channel: 'result', stack:localStack, dv: Dv_theo_2, data:Global_data});

        if(localStack.nb < Global_data.max) {
            generateFuelStacks(localStack);
        }
    }
    
}

// Ad a new part in stack;
function addPartToStack(stack, part) {

    var localStack = clone(stack);
    localStack.mass.full += part.mass.full;
    localStack.mass.empty += part.mass.empty;
    localStack.cost += part.cost;
    localStack.nb++;
    localStack.bottom = part.stackable.bottom;
    var added = false;
    for(var item in localStack.solution) {
        if(part.id == localStack.solution[item].id) {
            localStack.solution[item].nb++;
            added = true;
            break;
        }
    }
    if(added == false) {
        localStack.solution.push({
            id: part.id,
            name: part.name,
            nb: 1,
        });
    }

    return localStack;
}
