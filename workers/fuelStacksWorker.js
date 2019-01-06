importScripts('../lib/lib.js');

var Parts = [];
var MaxTanks = 0;
var worker_id = 'fuelStacksWorker';
var stacks = [];
var stack_keys = [];
self.addEventListener('message', function(e) {
    var inputs = e.data;

    if (inputs.channel === 'create') {
        MaxTanks = inputs.nbTanks;
        Parts = inputs.parts;
        DEBUG.setStatus(inputs.debug.status);
        DEBUG.setStart(inputs.debug.startTime);
        DEBUG.send(worker_id + ' # created');
        return;
    }

    if (inputs.channel === 'run') {
        DEBUG.send(worker_id + ' # run');
        
        // Generate Stacks
        generateStacks(null, {});

        self.postMessage({channel:'end', stacks : stacks});
        self.close();
    }
});

    // Test if key are new
    function checkStackKeys(keys) {
        for(var i in stack_keys) {
            if(stack_keys[i].length != keys.length) continue;
            if(keys.equals(stack_keys[i])) return false;
        }
        return true;
    }

    // main generation function 
    function generateStacks(topSize, stack) {
    
        for (var i in Parts) {
    
            // select part
            var current = Parts[i];
    
            // Manage First Part of Stack
            if (topSize == null) {
                // no start a stack with a radial
                if(current.is_radial == true) continue;
                
                // Create stack
                stack = {};
                stack.parts = [];
                stack.info = {};
                stack.keys = [];
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
                // if stack exists and current aren't radial, check size
                if(current.is_radial == false && topSize !== current.stackable.top) {
                    continue;
                }
            }

            // Test if stack are knowed
            var local_key = stack.keys.concat(current.id);
            if(checkStackKeys(local_key) !=  true) {
                //console.log(' KO : ' + local_key.join('---'));
                continue;
            }

            // Manage fuelType
            if (current.ressources != undefined) {
                // First Stack part with fuel
                if (stack.info.ressources == undefined) {
                    stack.info.ressources = current.ressources;
                }
                else {
                    // Check if part are correct fuel
                    var currentContent = current.ressources;
                    var neededRessources = stack.info.ressources;
                    if (!currentContent.equals(neededRessources)) {
                        continue;
                    }
                }
            }
    
            // add Part to stack
            var localStack = clone(stack);
            localStack.parts.push({ id: current.id, name: current.name, provider: current.provider });
            localStack.info.nb = localStack.parts.length;
            localStack.keys.push(current.id);
            
            // add mass & provider to stack
            localStack.info.mass.full += current.mass.full;
            localStack.info.mass.empty += current.mass.empty;
            localStack.info.provider[current.provider] = current.provider;
            localStack.info.cost += current.cost;
    
            // if part aren't radial, update size
            if(current.is_radial == false) {
                localStack.info.stackable.bottom = current.stackable.bottom;
            }
            
            // push stack
            stacks.push(localStack);
            stack_keys.push(localStack.keys);
            //console.log(' OK : ' + local_key.join('---'));
            self.postMessage({channel:'info', nb : stacks.length});
            
            // If stack can be continued 
            if (localStack.info.nb < MaxTanks) {
                generateStacks(current.stackable.bottom, localStack);
            }
        }
    }