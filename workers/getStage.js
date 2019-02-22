importScripts('../lib/lib.js', 'getFuelTanks.js');
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
        DEBUG.send(worker_id + ' # created');
    }

    if (inputs.channel == 'run') {
        Global_data = inputs.data;
        console.log(Global_data);
        startTime = new Date();
        DEBUG.send(worker_id + ' # run');
        drawMeARocket();
        return;
    }
});

// Processing functions
function drawMeARocket() {
    // Make Calculations
    giveMeAllSingleStage(localengines);

    // Add timeout before end computation message sending
    setTimeout(function () { autostop(); }, 10);
}

function giveMeAllSingleStage() {

    // Rewrite All ! 


    var targetDv = clone(Global_data.rocket.dv);
    var twr = clone(Global_data.rocket.twr);
    var SOI = clone(Global_data.SOI.kerbin);

    for (var i in Parts.engines) {

        var engine = Parts.engines[i];

        if (Global_data.rocket.bottom !== true && engine.stackable.bottom == false) {
            self.postMessage({ channel: 'badDesign' });
            continue;
        }

        if (Global_status == 'stop') {
            return null;
        }

        // Get Engine ISP / Thrust
        var caracts = engine.caract;
        // @TODO : Add Atm curve
        var curveData = getEngineCurveDateForAtm(caracts, 1);
        var ISP = curveData.ISP;
        var Thrust = curveData.Thrust;
        var cu = clone(Global_data.cu);

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
        cu.mass = cu.mass + decoupler.mass.full;

        // Add commandModule if needed
        var command = { mass: 0, stack: [], nb:0, cost:0 };
        cu.mass = cu.mass + command.mass;

        // Prepare Masses values
        var MassEngineFull = engine.mass.full;
        var MassEngineDry = engine.mass.empty;
        var MstageDry = cu.mass + decoupler.mass.full + command.mass + MassEngineDry;
        var MstageFull = cu.mass + decoupler.mass.full + command.mass + MassEngineFull;

        // calculate Fuel mass for the needed for Dv
        var DvFactor = Math.exp(targetDv / (ISP * SOI.Go));
        var Mcarbu = (DvFactor - 1) * MstageDry;
        // Calcul of Mcarbu => OK ! Verified 10times

        var no_tank = false;

        // If Engine contain fuel ( Booster or TwinBoar )
        var EngineFuelMass = 0;
        if (MassEngineDry < MassEngineFull) {
            EngineFuelMass = MassEngineFull - MassEngineDry;
            Mcarbu -= EngineFuelMass;
            // If onboard fuel are suffisant
            if (Mcarbu < 0) {
                Mcarbu = 0;
                no_tank = true;
            }
        }

        // Manage solid Boosters
        if (engine.caract.type == 'SolidBooster') {
            if (Mcarbu > 0) {
                //console.log('=>  OUT not enought powder');
                // not enough solid fuel in engine 
                self.postMessage({ channel: 'badDesign' });
                continue;
            } else {
                // Booster get enougth dv
                no_tank = true;
            }
        }

        // Get Out engines where Mcarbu outrise twr
        if (!testTwr(Thrust, MstageFull + Mcarbu, twr, SOI.Go)) {
            //console.log('=>  OUT not enought TWR (' + Thrust / (MstageFull + Mcarbu) / SOI.Go + ')' );
            self.postMessage({ channel: 'badDesign' });
            continue;
        }

        var TankSolution = {};
        if (no_tank === false) {
            // Get Tank configuration
            var stageDataForTank = {
                // Engine informations
                engine: engine,
                ISP: ISP,
                thrust: Thrust,

                // Performance Target
                cu: cu,
                targetDv: targetDv,

                // Constraints
                twr: twr,
                Go: SOI.Go
            };
            //console.log(' TESTING ' + Parts.engines[i].name + '(' + Parts.engines[i].id + ')');
            TankSolution = getFuelTankSolution(stageDataForTank);
            if (TankSolution === null) {
                //console.log('=>  OUT not tank solution' );
                self.postMessage({ channel: 'badDesign' });
                continue;
            }
            else {
                //console.log(stageDataForTank);
            }
            /*
            console.log('#### FUEL TANK SOLUTION #####');
            console.log(stageDataForTank);
            console.log(TankSolution);
            console.log('###########');
            */
        } else {
            TankSolution.mFuel = 0;
            TankSolution.mDry = 0;
            TankSolution.cost = 0;
            TankSolution.nb = 0;
            TankSolution.solution = [];
        }

        // Make stage caracterics
        MstageFull = cu.mass + MassEngineFull + TankSolution.mFuel + TankSolution.mDry;
        MstageDry = cu.mass + MassEngineDry + TankSolution.mDry;
        var stageFuelMass = TankSolution.mFuel + EngineFuelMass;
        var TwrFull = Thrust / MstageFull / SOI.Go;
        var TwrDry = Thrust / MstageDry / SOI.Go;
        var burnDuration = stageFuelMass * ISP * SOI.Go / Thrust;
        var Dv = ISP * SOI.Go * Math.log(MstageFull / MstageDry);
        var cost = engine.cost + decoupler.cost + command.cost + TankSolution.cost;
        var nb = engine.nb + 1 + command.nb + TankSolution.solution.length;
        var stage = {
            decoupler: decoupler.name,
            commandModule: command.stack,
            tanks: TankSolution.solution,
            engine: engine.name,
            mcarbu: stageFuelMass,
            twr: {
                min: TwrFull,
                max: TwrDry
            },
            totalMass: MstageFull,
            burn: burnDuration,
            stageDv: Dv,
            targetDv: targetDv,

        };
        var output = {
            stages: [stage],
            totalMass: stage.totalMass,
            burn: stage.burn,
            stageDv: Dv,
            nbStages: 1,
            cost: cost,
            nb:nb,
            size: engine.stackable.bottom
        };
        self.postMessage({ channel: 'result', output: output, id: worker_id, data: Global_data });
    }
}

function getDecoupler(size) {
    for (var i in Parts.decouplers) {
        var decoupler = Parts.decouplers[i];
        if (decoupler.stackable.top == size && decoupler.isOmniDecoupler === false) {
            return decoupler;
        }
    }
    return null;
}

function getEngineCurveDateForAtm(engineCaracts, AtmPressur) {
    var curve = engineCaracts.curve;
    for (var point_id in curve) {
        var point = curve[point_id];
        if (point.atmo == AtmPressur) {
            return point;
        }
    }
}


function testTwr(Thrust, Mass, target, Go) {
    var Twr = Thrust / Mass / Go;

    if (!target.max) {
        return Twr > target.min;
    }
    else {
        return (Twr > target.min && Twr < target.max);
    }
}
