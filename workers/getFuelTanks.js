/********************/
/** Tank selection **/
/********************/

function getFuelTankSolution(stageData) {
    if (Global_status == 'stop') {
        return null;
    }
    //console.log(' Making fuel tank for ' + stageData.engine.name + '(' + stageData.engine.id + ')');
    var bestSolution = {};
    var bestOverflow = 999;
    var EnginesNeeded = stageData.engine.caract.conso.proportions;
    var cu_size = stageData.cu.size;
    var engine_size = stageData.engine.stackable.top;

    for (var i in Parts.fuelTanksStacks) {
        var stack = Parts.fuelTanksStacks[i];

        // Control size (75% out)
        if (stack.info.stackable.top != cu_size || stack.info.stackable.bottom != engine_size) {
            continue;
        }

        // Control Fuel Type
        if (stack.info.ressources != undefined && !stack.info.ressources.equals(getKeys(EnginesNeeded))) {
            continue;
        }

        // Control overFlow
        var OverFlow = getStackOverflow(stack.info, stageData);
        if (OverFlow == null || OverFlow < 0) {
            continue;
        }

        if (OverFlow < bestOverflow) {
            bestOverflow = OverFlow;

            bestSolution = {
                mFuel: stack.info.mass.full - stack.info.mass.empty,
                mDry: stack.info.mass.empty,
                cost: stack.info.cost,
                solution: stack.parts
            };
        }
    }

    return (bestOverflow < 999) ? bestSolution : null;
}


function getStackOverflow(stackData, stageData) {
    // Prepare Masses values
    var MassEngineFull = stageData.engine.mass.full;
    var MassEngineDry = stageData.engine.mass.empty;
    var MstageDry = stageData.cu.mass + MassEngineDry + stackData.mass.empty;
    var MstageFull = stageData.cu.mass + MassEngineFull + stackData.mass.full;

    // test Dv
    var Dv = stageData.ISP * stageData.Go * Math.log(MstageFull / MstageDry);
    if (Dv < stageData.targetDv) {
        return null;
    }

    // Test TWR
    if (!testTwr(stageData.thrust, MstageFull, stageData.twr, stageData.Go)) {
        return null;
    }

    // Return Dv Overflow
    return Dv - stageData.targetDv;
}
