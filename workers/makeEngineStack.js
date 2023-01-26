importScripts('../lib/lib.js');

"use strict";

/******************/
/* Init Variables */
/******************/
let startTime = new Date();

// Main worker data
let maxRadials = 0;
let Parts = {};
let Global_status = 'wait';

/**
 * Worker Communication.
 */
self.addEventListener('message', function (e) {
    let inputs = e.data;

    // I'm a newborn, main script feed me with collection of parts.
    if (inputs.channel === 'create') {
        DEBUG.setStatus(inputs.debug);
        DEBUG.setStart(startTime);
        Global_status = 'run'
        Parts = inputs.parts;
        maxRadials = inputs.radials
        DEBUG.send('Generate Engines # created');
    }

    // Main script make me work.
    if (inputs.channel === 'run') {
        DEBUG.send('Generate Engines # start');
        run();
    }

    // Main script don't need me anymore.
    if (inputs.channel === 'stop') {
        Global_data = undefined;
        Parts = undefined;
        close();
    }
});

/**
 * Main function
 */
function run() {

    // Generate all stacks
    let enginesStack = makeEngineStacks(Parts.engines, Parts.couplers, maxRadials);

    // Send stack to main script.
    self.postMessage({ channel: 'results', results: enginesStack});
}


/**
 * Generate all possibles Engine stack configurations
 */
function makeEngineStacks(engines, couplers, maxRadials) {

    let stacks = [];

    // For each engine
    for (let engine_id in engines) {

        let engine = engines[engine_id];
        engine.nb = 1;

        // Add single Engine to engine stack.
        let singleEngine = clone(engine);
        singleEngine.provider = [singleEngine.provider];
        singleEngine.tech = [singleEngine.tech];
        singleEngine.parts = [{ id: engine.id, name: engine.name, nb: 1 }];
        stacks.push(singleEngine);
        self.postMessage({ channel: 'nb', nb: stacks.length});
        singleEngine = undefined;

        // If engine is radial
        if (engine.is_radial === true) {
            // Generate a stack for each radial configuration.
            for(let nb_radial = 2; nb_radial <= maxRadials ; nb_radial++) {

                let RadialEngine = clone(engine);
                // Update engine data.
                RadialEngine.parts = [{ id: engine.id, name: engine.name, nb: nb_radial }];
                RadialEngine.id = nb_radial + '_' + engine.id;
                RadialEngine.mass.full = nb_radial * engine.mass.full;
                RadialEngine.mass.empty = nb_radial * engine.mass.empty;
                RadialEngine.cost = nb_radial * engine.cost;
                RadialEngine.name = engine.name + ' x ' + nb_radial;
                RadialEngine.provider = [RadialEngine.provider];
                RadialEngine.tech = [RadialEngine.tech];
                // Correct Thrust values
                for (let radial_curve_id in RadialEngine.curve) {
                    RadialEngine.curve[radial_curve_id].Thrust = nb_radial * engine.curve[radial_curve_id].Thrust;
                }

                // Add new engine to stack.
                stacks.push(RadialEngine);
                self.postMessage({ channel: 'nb', nb: stacks.length});
                RadialEngine = undefined;
            }
        } else {

            // Try to put engine on a coupler
            for (let coupler_id in couplers) {
                let coupler = couplers[coupler_id];

                // If coupler has resources.
                if(coupler.ressources !== undefined) {
                    // if resources are not sames as engine, change coupler
                    if(!compareSimpleArray(coupler.ressources, engine.conso)) {
                        continue
                    }
                }

                // Test all stackable options
                for(let bottomStack in coupler.stackable.bottom ) {

                    let bottomStackSolution = coupler.stackable.bottom[bottomStack];

                    // If engine don't fit in coupler stack bottom, next stackable option.
                    if (engine.stackable.top !== bottomStackSolution.size) {
                        continue;
                    }

                    // Create new Engine
                    let nb_engines = bottomStackSolution.bottom_number;
                    let new_engine = clone(engine);
                    // Update engine data.
                    new_engine.id = coupler.id + '_' + nb_engines + '_' + engine.id;
                    new_engine.mass.full = round(coupler.mass.full + nb_engines * engine.mass.full, 4);
                    new_engine.mass.empty = round(coupler.mass.empty + nb_engines * engine.mass.empty, 4);
                    new_engine.cost = round(coupler.cost + nb_engines * engine.cost, 4);
                    new_engine.name = coupler.name + ' + ' + engine.name + ' x ' + nb_engines;

                    // Correct Thrust values
                    for (let curve_id in new_engine.curve) {
                        new_engine.curve[curve_id].Thrust = nb_engines * engine.curve[curve_id].Thrust;
                    }

                    new_engine.stackable.top = coupler.stackable.top;
                    // Mark stack as not stackable.
                    new_engine.stackable.bottom = false;

                    // Manage Provider & tech
                    let provider = [];
                    provider.push(new_engine.provider);
                    provider.push(coupler.provider);
                    new_engine.provider = provider.filter(onlyUnique);
                    let tech = [];
                    tech.push(new_engine.tech);
                    tech.push(coupler.tech);
                    new_engine.tech = tech.filter(onlyUnique);

                    new_engine.nb = nb_engines + 1;
                    new_engine.parts = [{ id: engine.id, name: engine.name, nb: nb_engines }];
                    new_engine.parts.push({ id: coupler.id, name: coupler.name, nb: 1 });

                    // push new Engine
                    stacks.push(clone(new_engine));
                    self.postMessage({ channel: 'nb', nb: stacks.length});
                }
            }
        }
    }

    return stacks;
}

