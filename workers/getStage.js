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
    giveMeAllSingleStage();

    // Add timeout before end computation message sending
    setTimeout(function () { autostop(); }, 10);
}

function giveMeAllSingleStage() {

    // Rewrite All ! 

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

    engineLoop:
    for (var i in Parts.engines) {

        // Intercept Stop
        if (Global_status == 'stop') {
            return null;
        }

        var engine = Parts.engines[i];
        console.log(engine);

        // Prepare Masses values
        var MassEngineFull = engine.mass.full;
        var MassEngineDry = engine.mass.empty;
        var MstageDry = cu.mass + decoupler.mass.full + command.mass + MassEngineDry;
        var MstageFull = cu.mass + decoupler.mass.full + command.mass + MassEngineFull;

        var curveData = getCaractForAtm(engine.curve, AtmPressurAtEnd);
        var ISP = curveData.ISP;
        var Thrust = curveData.Thrust;

        if(!testTwr(Thrust, MstageDry, twr, SOI.Go)) {
            console.log('=>  OUT not enought TWR on empty for ' + engine.name );
            self.postMessage({ channel: 'badDesign' });
            continue engineLoop;
        }

        // Manage solid Boosters
        if (engine.conso[0] == 'SolidFuel') {
            // No fuel tack possible
            if(!testTwr(Thrust, MstageFull, twr, SOI.Go)) {
                console.log('=>  OUT not enought TWR on fuel for booster ' + engine.name );
                self.postMessage({ channel: 'badDesign' });
                continue engineLoop;
            }

            var Dv = ISP * SOI.Go * Math.log(MstageFull / MstageDry);
            var Dv_before_burn = restDvAfterEnd - Dv;
            var AtmPressurBeforeBurne = AtmPressurEstimator(Dv_before_burn);

            var stage = make_stage(AtmPressurBeforeBurne, engine, command, decoupler, null);
            self.postMessage({ channel: 'result', stage: stage, id: worker_id, data: Global_data });
        }

        // Generate all Tank stacks
        //fuelStackLoop:
        









        // REWRITE
        // REWRITE
        // REWRITE

        // Get Engine ISP / Thrust
        //console.log(engine);
        // @TODO : Add Atm curve
        var curveData = getEngineCurveDateForAtm(caracts, 1);
        var ISP = curveData.ISP;
        var Thrust = curveData.Thrust;
        var cu = clone(Global_data.cu);


        cu.mass = cu.mass + decoupler.mass.full;

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









/************/
/* New code */
/************/

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

// Test TWR
function testTwr(Thrust, Mass, twr_target, Go) {
    var Twr = Thrust / Mass / Go;

    if (!twr_target.max) {
        return Twr > twr_target.min;
    }
    else {
        return (Twr > twr_target.min && Twr < twr_target.max);
    }
}

// Get Estimated Atm Pressur from RestDv
function AtmPressurEstimator(RestDv) {
    if(RestDv >= 3500) return 0;

    // Inject atm modele here
    return Math.ceil(RestDv/3500);
}

// return ISP/thrust of Engine for a AtmPressur
function getCaractForAtm(engineCurve, AtmPressur) {

    // if AtmPressure need is vaccum, return it
    if(AtmPressur == 0) {
        return engineCurve[0];
    }
    else {
        // Else set vac values
        vac_isp = engineCurve[0].ISP;
        vac_thrust = engineCurve[0].Thrust;
    }

    // Atmo curve are atm ascendent
    for(var point in engineCurve) {
        // if AtmPressur > last curve atmo
        if(engineCurve[point].atmo < AtmPressur && typeof engineCurve[point+1] == 'undefined') {
            return engineCurve[point];
        }

        // estimate value for atm pressure
        if(engineCurve[point].atmo < AtmPressur && engineCurve[point+1].atmo > AtmPressur) {
            var atm_diff = engineCurve[point+1].atmo - engineCurve[point].atmo;
            var ISP_deriv = (engineCurve[point+1].ISP - engineCurve[point].ISP) / atm_diff;
            var Thrust_deriv = (engineCurve[point+1].Thrust - engineCurve[point].Thrust) / atm_diff;
            
            var output = {
                atmo:AtmPressur,
                ISP: ISP_deriv * AtmPressur + vac_isp,
                Thrust: Thrust_deriv * AtmPressur + vac_thrust,
            };
            
            return output;
        }
    }

    console.log({'msg':'Error','curve':engineCurve, 'atm':AtmPressur});
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