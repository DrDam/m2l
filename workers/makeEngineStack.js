importScripts('../lib/lib.js');
/******************/
/* Init Variables */
/******************/
let startTime = new Date();

// Main worker data
let maxRadials = 0;
let Parts = {};
let Global_status = 'wait';
self.addEventListener('message', function (e) {
    let inputs = e.data;

    // I'm a newborn, Master give me a name & feed me with collection of parts.
    if (inputs.channel === 'create') {
        DEBUG.setStatus(inputs.debug);
        DEBUG.setStart(startTime);
        Global_status = 'run'
        Parts = inputs.parts;
        maxRadials = inputs.radials
        DEBUG.send('Generate Engines # created');
    }

    if (inputs.channel === 'run') {
        DEBUG.send('Generate Engines # start');
        run();
    }

    // I'm a newborn, Master give me a name & feed me with collection of parts.
    if (inputs.channel === 'stop') {
        Global_data = undefined;
        Parts = undefined;
        close();
    }
});

function run() {

    let enginesStack = makeEngineStacks(Parts.engines, Parts.couplers, maxRadials);

    self.postMessage({ channel: 'results', results: enginesStack});

}


/**
 * Generate all possibles Engine stack configurations
 *
 * @param engines
 * @param couplers
 * @param maxRadials
 * @returns {*[]}
 */
function makeEngineStacks(engines, couplers, maxRadials) {

    let stacks = [];

    for (let engine_id in engines) {

        let engine = engines[engine_id];
        engine.nb = 1;

        // Add single Engine
        let singleEngine = clone(engine);
        singleEngine.parts = [{ id: engine.id, name: engine.name, nb: 1 }];
        stacks.push(singleEngine);
        self.postMessage({ channel: 'nb', nb: stacks.length});
        singleEngine = undefined;

        if (engine.is_radial === true) {
            for(let nb_radial = 2; nb_radial <= maxRadials ; nb_radial++) {
                let RadialEngine = clone(engine);
                RadialEngine.parts = [{ id: engine.id, name: engine.name, nb: nb_radial }];

                RadialEngine.id = nb_radial + '_' + engine.id;
                RadialEngine.mass.full = nb_radial * engine.mass.full;
                RadialEngine.mass.empty = nb_radial * engine.mass.empty;
                RadialEngine.cost = nb_radial * engine.cost;
                RadialEngine.name = nb_radial + 'x' + engine.name;

                for (let radial_curve_id in RadialEngine.curve) {
                    RadialEngine.curve[radial_curve_id].Thrust = nb_radial * engine.curve[radial_curve_id].Thrust;
                }

                stacks.push(RadialEngine);
                self.postMessage({ channel: 'nb', nb: stacks.length});
                RadialEngine = undefined;
            }
        } else {
            // Try to put engine on a coupler
            for (let coupler_id in couplers) {
                let coupler = couplers[coupler_id];

                // only If Engine mount on coupler
                if (engine.stackable.top !== coupler.stackable.bottom) {
                    continue;
                }

                // Create new Engine
                let nb_engines = coupler.stackable.bottom_number;
                let new_engine = clone(engine);
                new_engine.id = coupler.id + '_' + nb_engines + '_' + engine.id;
                new_engine.mass.full = round(coupler.mass.full + nb_engines * engine.mass.full, 4);
                new_engine.mass.empty = round(coupler.mass.empty + nb_engines * engine.mass.empty, 4);
                new_engine.cost = round(coupler.cost + nb_engines * engine.cost, 4);
                new_engine.name = coupler.name + ' + ' + nb_engines + 'x' + engine.name;
                for (let curve_id in new_engine.curve) {
                    new_engine.curve[curve_id].Thrust = nb_engines * engine.curve[curve_id].Thrust;
                }
                new_engine.stackable.bottom = false;

                new_engine.provider[coupler.provider] = coupler.provider;
                new_engine.nb = nb_engines + 1;
                new_engine.parts = [{ id: engine.id, name: engine.name, nb: nb_engines }];
                new_engine.parts.push({ id: coupler.id, name: coupler.name, nb: 1 });
                // push new Engine
                stacks.push(clone(new_engine));
                self.postMessage({ channel: 'nb', nb: stacks.length});
            }
        }
    }

    return stacks;
}

