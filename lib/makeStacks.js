// Generate Engines stacks 
// Engine + couplers
function generateEnginesStacks(engines, couplers) {

    var stacks = [];

    for (var engine_id in engines) {

        var engine = engines[engine_id];
        engine.nb = 1;
        // Add Engine
        PartToCalculation.engines.push(clone(engine));

        // Try put engine on a coupler
        for (var coupler_id in couplers) {
            var coupler = couplers[coupler_id];


            // only If Engine mount on coupler
            if (engine.stackable.top != coupler.stackable.bottom) {
                continue;
            }

            // Create new Engine
            var nb_engines = coupler.stackable.bottom_number;
            var new_engine = clone(engine);
            new_engine.id = coupler.id + '_' + nb_engines + '_' + engine.id;
            new_engine.mass.full = coupler.mass.full + nb_engines * engine.mass.full;
            new_engine.mass.empty = coupler.mass.empty + nb_engines * engine.mass.empty;
            new_engine.cost = coupler.cost + nb_engines * engine.cost;
            new_engine.name = coupler.name + ' + ' + nb_engines + 'x' + engine.name;
            new_engine.caract.MaxThrust = nb_engines * engine.caract.MaxThrust;
            for (var curve_id in new_engine.caract.curve) {
                new_engine.caract.curve[curve_id].Thrust = nb_engines * engine.caract.curve[curve_id].Thrust;
            }
            new_engine.stackable.bottom = false;
            new_engine.cost = coupler.cost + nb_engines * engine.cost;
            for (var fuel_type in new_engine.caract.conso.proportions) {
                new_engine.caract.conso.proportions[fuel_type] = nb_engines * engine.caract.conso.proportions[fuel_type];
            }
            new_engine.provider[coupler.provider] = coupler.provider;
            new_engine.nb = nb_engines + 1;
            // push new Engine
            stacks.push(clone(new_engine));
        }
    }
    
    return stacks;
}

// Generate tanks stacks
// (Tanks + adapters) * X       X <= maxPats 
function generateTanksStacks(tanks, adapters, maxParts) {

    var parts = tanks.concat(adapters);
    var stacksList = [];
    var stacksKeys = [];

    /**********************/
    /** Generate Stacks **/
    /********************/
    var generateStacks = function(topSize, stack) {
        if (topSize == undefined) {
            topSize = null;
        }
        if (stack == undefined) {
            stack = {};
        }

        for (var i in parts) {

            // select part
            var current = parts[i];

            // Manage First Part of Stack
            if (topSize == null) {
                stack = {};
                stack.parts = [];
                stack.info = {};
                stack.info.keys = [];
                stack.info.mass = {};
                stack.info.mass.empty = 0;
                stack.info.mass.full = 0;
                stack.info.cost = 0;
                stack.info.stackable = {};
                stack.info.stackable.top = current.stackable.top;
                stack.info.provider = {};
                stack.info.provider[current.provider] = current.provider;
                stack.info.nb = 0;
            }
            else {
                // if other part of stack, check assembly
                if (topSize !== current.stackable.top) {
                    continue;
                }
            }

            // Check if assembly not allready knowed
            // I.E. : LT-400 + LT-800 == LT-800 + LT-400
            if(!checkKeys(current.id, stack.info.keys)) {
                continue;
            }

            // Manage fuelType
            if (current.ressources != undefined) {
                // First Stack part with fuel
                if (stack.info.ressources == undefined) {
                    stack.info.ressources = getKeys(current.ressources);
                }
                else {
                    // Check if part are correct fuel
                    var currentContent = getKeys(current.ressources);
                    var neededRessources = stack.info.ressources;
                    if (!currentContent.equals(neededRessources)) {
                        continue;
                    }
                }
            }

            // add Part to stack
            var localStack = clone(stack);
            localStack.parts.push({ id: current.id, name: current.name, provider: current.provider });
            //localStack.parts.push(current);
            localStack.info.keys.push(current.id);

            // add mass & provider to stack
            localStack.info.mass.full += current.mass.full;
            localStack.info.mass.empty += current.mass.empty;
            localStack.info.provider[current.provider] = current.provider;
            localStack.info.cost += current.cost;

            // push stack
            localStack.info.stackable.bottom = current.stackable.bottom;
            localStack.info.nb = localStack.parts.length;
            stacksList.push(localStack);

            if (localStack.parts.length < maxParts) {
                generateStacks(current.stackable.bottom, localStack);
            }
        }
    };

    // checkkeys
    var checkKeys = function(newkey, stackKeys) {
        var testKey =  clone(stackKeys).push(newkey);
        for(var i in stackKeys) {
            if(stackKeys[i].equals(testKey)) {
                return false;
            }
        }
        stackKeys.push(testKey);
        return true;
    };


    // Run !
    generateStacks();
    // Return results
    return stacksList;
}