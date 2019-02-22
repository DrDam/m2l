function makeEngineStacks(engines, couplers, maxRadials) {

    var stacks = [];

    for (var engine_id in engines) {

        var engine = engines[engine_id];
        engine.nb = 1;

        // Add single Engine
        var singleEngine = Object.create(engine);
        singleEngine.part = [{ id: engine.id, name: engine.name, nb: 1 }];
        stacks.push(singleEngine);
        singleEngine = undefined;

        if (engine.is_radial == true) {
            for(var nb_radial = 2; nb_radial <= maxRadials ; nb_radial++) {
                var RadialEngine = Object.create(engine);
                RadialEngine.parts = [{ id: engine.id, name: engine.name, nb: nb_radial }];
                
                RadialEngine.id = nb_radial + '_' + engine.id;
                RadialEngine.mass.full = nb_radial * engine.mass.full;
                RadialEngine.mass.empty = nb_radial * engine.mass.empty;
                RadialEngine.cost = nb_radial * engine.cost;
                RadialEngine.name = nb_radial + 'x' + engine.name;
                
                for (var radial_curve_id in RadialEngine.curve) {
                    RadialEngine.curve[radial_curve_id].Thrust = nb_radial * engine.curve[radial_curve_id].Thrust;
                }

                stacks.push(RadialEngine);
                RadialEngine = undefined;
            }


        } else {
            // Try put engine on a coupler
            for (var coupler_id in couplers) {
                var coupler = couplers[coupler_id];

                // only If Engine mount on coupler
                if (engine.stackable.top != coupler.stackable.bottom) {
                    continue;
                }

                // Create new Engine
                var nb_engines = coupler.stackable.bottom_number;
                var new_engine = Object.create(engine);
                new_engine.id = coupler.id + '_' + nb_engines + '_' + engine.id;
                new_engine.mass.full = coupler.mass.full + nb_engines * engine.mass.full;
                new_engine.mass.empty = coupler.mass.empty + nb_engines * engine.mass.empty;
                new_engine.cost = coupler.cost + nb_engines * engine.cost;
                new_engine.name = coupler.name + ' + ' + nb_engines + 'x' + engine.name;
                for (var curve_id in new_engine.curve) {
                    new_engine.curve[curve_id].Thrust = nb_engines * engine.curve[curve_id].Thrust;
                }
                new_engine.stackable.bottom = false;

                new_engine.provider[coupler.provider] = coupler.provider;
                new_engine.nb = nb_engines + 1;
                // push new Engine
                stacks.push(Object.create(new_engine));
            }
        }
    }

    return stacks;
}
