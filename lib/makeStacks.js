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
                new_engine.mass.full = coupler.mass.full + nb_engines * engine.mass.full;
                new_engine.mass.empty = coupler.mass.empty + nb_engines * engine.mass.empty;
                new_engine.cost = coupler.cost + nb_engines * engine.cost;
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
            }
        }
    }

    return stacks;
}

/**
 * Generate all possibles Fuel stack configurations
 *
 * @param tanks
 * @param adapters
 * @param maxParts
 * @returns {*[]}
 */
function generateTanksStacks(tanks, adapters, maxParts) {

    let parts = tanks.concat(adapters);
    let stacksList = [];
    let stacksListIds = [];

    /**********************/
    /** Generate Stacks **/
    /********************/
    function generateStacks(topSize, stack) {

        for (let i in parts) {

            // select part
            let current = parts[i];

            // It's stack first part.
            if (topSize === undefined) {
                stack = {};
                stack.id = [];
                stack.parts = [];
                stack.info = {};
                stack.info.mass = {};
                stack.info.mass.empty = 0;
                stack.info.mass.full = 0;
                stack.info.cost = 0;
                stack.info.stackable = {};
                stack.info.stackable.top = current.stackable.top;
                stack.info.stackable.bottm = undefined;
                stack.info.provider = {};
                stack.info.provider[current.provider] = current.provider;
                stack.info.nb = 0;
            }
            else {
                // Check part size
                if (topSize !== current.stackable.top) {
                    continue;
                }
            }

            // Manage fuelType
            if (current.ressources !== undefined) {
                // First Stack part with fuel
                if (stack.info.ressources === undefined) {
                    stack.info.ressources = current.ressources;
                }
                else {
                    // Check if part are correct fuel
                    let currentContent = current.ressources;
                    let neededRessources = stack.info.ressources;
                    if (!currentContent.equals(neededRessources)) {
                        continue;
                    }
                }
            }

            // Manage duplicates
            if(isDuplicates(stack.id, current.id, stacksListIds)) {
                continue;
            }

            // add Part to stack
            let localStack = clone(stack);
            localStack.parts.push({ id: current.id, name: current.name, provider: current.provider });

            // add mass & provider to stack
            localStack.info.mass.full += current.mass.full;
            localStack.info.mass.empty += current.mass.empty;
            localStack.info.provider[current.provider] = current.provider;
            localStack.info.cost += current.cost;

            // push stack
            localStack.info.stackable.bottom = current.stackable.bottom;
            localStack.info.nb = localStack.parts.length;

            stacksList.push(localStack);
            localStack.id.push(current.id)
            stacksListIds.push(localStack.id)

            if (localStack.parts.length < maxParts) {
                generateStacks(current.stackable.bottom, localStack);
            }
        }
    }

    let isDuplicates = function(stack_id, current_id, stacksListIds) {
        if(stacksListIds === []) {
            return false;
        }

        local_stack_id = clone(stack_id);
        local_stack_id.push(current_id);
        //console.group(local_stack_id.sort().join('---'));
        for (let stacksListIdsKey in stacksListIds) {
        //console.log(stacksListIds[stacksListIdsKey].sort().join('---'));
            if(local_stack_id.sort().join('---') === stacksListIds[stacksListIdsKey].sort().join('---')) {
                //console.log('Find !');
                //console.groupEnd();
                return true;
            }
        }
//        console.groupEnd();
        return false;
    }

    // Run !
    generateStacks();
    // Return results
    return stacksList;
}
