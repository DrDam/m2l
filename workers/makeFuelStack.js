importScripts('../lib/lib.js');
/******************/
/* Init Variables */
/******************/
let startTime = new Date();

// Main worker data
let maxTanks = 0;
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
        maxTanks = inputs.maxTanks
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

    let stacks = generateTanksStacks(Parts.fuelTanks, Parts.adapters, maxTanks);

    stacks = sortStacks(stacks);

    self.postMessage({ channel: 'results', results: stacks});

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
    let stacksList = {};
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

            // Manage duplicates LT_400+LT_800 = LT_800+LT_400
            if(isDuplicates(stack.id, current.id, stacksListIds)) {
                continue;
            }

            // add Part to stack
            let localStack = clone(stack);
            localStack.parts.push({ id: current.id, name: current.name, provider: current.provider });

            // add mass & provider to stack
            localStack.info.mass.full = round( localStack.info.mass.full + current.mass.full,4);
            localStack.info.mass.empty = round( localStack.info.mass.empty + current.mass.empty,4);
            localStack.info.provider[current.provider] = current.provider;
            localStack.info.cost = round( localStack.info.cost + current.cost);

            // push stack
            localStack.info.stackable.bottom = current.stackable.bottom;
            localStack.info.nb = localStack.parts.length;

            stacksListIds.push(localStack.id);
            localStack.id.push(current.id);

            // Manage suboptimals  LT_400+LT_400 = LT_800
            stacksList = CleanSubOptimals(localStack, stacksList);

            if (localStack.parts.length < maxParts) {
                generateStacks(current.stackable.bottom, localStack);
            }
        }
    }

    // Try to find another stack with the same ID.
    let isDuplicates = function(stack_id, current_id, stacksListIds) {
        if(stacksListIds === []) {
            return false;
        }

        local_stack_id = clone(stack_id);
        local_stack_id.push(current_id);

        for (let stacksListIdsKey in stacksListIds) {

            if(local_stack_id.sort().join('---') === stacksListIds[stacksListIdsKey].sort().join('---')) {

                return true;
            }
        }

        return false;
    }

    // Final testing and sorting of stacks
    let CleanSubOptimals = function(localStack, stacksList) {

        if (localStack.info.ressources == undefined) {
            localStack.info.ressources = ['none'];
        }
        let key_ressource = localStack.info.ressources.sort().join('--');
        let key_top = localStack.info.stackable.top;
        let key_bottom = localStack.info.stackable.bottom;

        if (stacksList[key_ressource] == undefined)
            stacksList[key_ressource] = {}

        if (stacksList[key_ressource][key_top] == undefined)
            stacksList[key_ressource][key_top] = {}

        if (stacksList[key_ressource][key_top][key_bottom] == undefined)
            stacksList[key_ressource][key_top][key_bottom] = []

        for (let stacksListKey in stacksList[key_ressource][key_top][key_bottom]) {

            let testStack = stacksList[key_ressource][key_top][key_bottom][stacksListKey];

            // If masses are identicals.
            if (testStack.info.mass.full === localStack.info.mass.full
                && testStack.info.mass.empty === localStack.info.mass.empty ) {
                // Keep the one with the less parts.
                if (localStack.info.nb >= testStack.nb) {
                    return stacksList;
                }
                else {
                    stacksList[key_ressource][key_top][key_bottom].splice(stacksListKey, 1);
                }
            }
        }
        stacksList[key_ressource][key_top][key_bottom].push(localStack);
        self.postMessage({ channel: 'nb', nb: countStack(stacksList)});
        return stacksList;
    }

    // Generate all stacks !
    generateStacks();

    // merge Ressources None in other categories
    let adaptersStack = clone(stacksList.none);
    delete stacksList.none;

    for(let topSize in adaptersStack) {
        for (let bottomSize in adaptersStack[topSize]) {
            for(let fuelType in stacksList) {
                if (stacksList[fuelType] !== undefined &&
                    stacksList[fuelType][topSize] !== undefined &&
                    stacksList[fuelType][topSize][bottomSize] !== undefined)
                {
                    stacksList[fuelType][topSize][bottomSize] = stacksList[fuelType][topSize][bottomSize].concat(adaptersStack[topSize][bottomSize]);
                }
            }
        }
    }

    self.postMessage({ channel: 'nb', nb: countStack(stacksList)});

    // Return results
    return stacksList;
}

function countStack(stacksList) {
    let nb = 0;
    for(let i in stacksList) {
        for (let j in stacksList[i]) {
            for (let k in stacksList[i][j]){
                nb += stacksList[i][j][k].length;
            }
        }
    }
    return nb;
}

function sortStacks(stacks) {

    for(let fuelType in stacks) {
        for (let topSize in stacks[fuelType]) {
            for (let bottomSize in stacks[fuelType][topSize]) {
                stacks[fuelType][topSize][bottomSize] = sortByMass(stacks[fuelType][topSize][bottomSize]);
            }
        }
    }
    return stacks;
}

function sortByMass(array) {
    return array.sort(function(a, b)
    {
        var x = a.info.mass.full; var y = b.info.mass.full;
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}