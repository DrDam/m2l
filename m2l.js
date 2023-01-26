
"use strict";

// Global Variables
let computationData = {};
const PartToCalculation = {};
PartToCalculation.decouplers = [];
PartToCalculation.engines = [];
PartToCalculation.fuelable = [];
const collection = {};
let SelectedParts = {};
let waitDraw = false;
// Initialize variables
let config_count = 0;
let valid_count = 0;
let result_id = 0;

// Init worker variable
let master;

// Main Wrapper
(function ($) {

    // If Document Ready
    $(document).ready(function () {

        /******************/
        /* Populate items */
        /******************/

        // Populate CU size select
        $.each(Sizes, function (i, item) {
            let data = {
                value: item.id,
                text: item.label
            };
            if (item.id === '1') {
                data.selected = 'selected';
            }
            $('#sizeCU').append($('<option>', data));
        });

        // Populate "simple" part selector
        $('#parts').append($('<option>', { value: 'all', text: 'all', selected: 'selected' }));
        $.each(providers, function (i, item) {
            let data = {
                value: item,
                text: item
            };
            $('#parts').append($('<option>', data));
        });

        // Populate "SOI"
        $.each(SOI, function (i, item) {
            let data = {
                value: i,
                text: item.Name
            };
            if (item.Name === 'Kerbin') {
                data.selected = 'selected';
            }
            $('#soi').append($('<option>', data));
        });
        // Set Kerbin LowOrbitDv for default Dv Target
        $('#DvTarget').val(SOI['kerbin'].BasicMissionDv);
        // if SOI change, update Dv Target
        $('#soi').change(function () {
            let val = $(this).find(":selected").val();
            $('#DvTarget').val(SOI[val].BasicMissionDv);
        })

        // Populate "advanced" part selector
        let domParent = '#advanced_part_list';
        // wait data gathering.
        setTimeout(() => {
            $.get('../tpl/partList.mst', function (partListTpl) {
                // Generate Advanced part selection
                for (let category in Parts) {
                    let part_category = [];
                    for (let part_item in Parts[category]) {
                        let part = Parts[category][part_item];
                        part_category.push({ name: part.name, id: part.id, provider: part.provider });
                    }

                    let html = Mustache.render(partListTpl, { category: category, parts: part_category });
                    $(domParent).append(html);
                }

                // Add interactions on advanced part selection
                $('.part-category').click(function () {
                    let ref = $(this).attr('data-ref');
                    $('ul[data-ref=' + ref + ']').toggle();
                    if ($(this).hasClass('closed')) {
                        $(this).removeClass('closed');
                    }
                    else {
                        $(this).addClass('closed');
                    }
                });

            }, 'text');
        }, 500);
        /**********************/
        /* End Populate items */
        /**********************/

        /**************************/
        /* Manage actions on page */
        /**************************/

        // toggle information block
        $("#readme_button").click(function () {
            $("#readme").toggle("slow", function () { });
        });

        // Disable "Dangerous features
        $('.warning_field_set:checkbox').change(function () {
            let check = $(this).prop('checked');

            if(check === false) {
                $(this).parents('fieldset').find(".fieldset_content").addClass('fieldset_disabled');
                $(this).parents('fieldset').find(".fieldset_content").find('input, select').each(function () {
                    $(this).attr('disabled', 'disabled');
                });
            }
            else {
                $(this).parents('fieldset').find(".fieldset_content").removeClass('fieldset_disabled');
                $(this).parents('fieldset').find(".fieldset_content").find('input, select').each(function () {
                    $(this).attr('disabled', null);
                });
            }
        });

        // Toggle part Mode
        $('input[type=radio][name=part_mode]').change(function () {
            $('.part-collection').hide();
            $('#' + $(this).val()).show();
        });

        // See Details of a stage
        $('#results table').on('click', 'tbody td', function () {
            $(this).parent().find("td:last-child").toggleClass("show");
            $('#results table tbody td.show').click(false);
        });

        // Binding Stop button
        $('#stop').click(function () {
            // Kill Calculation
            master.terminate();
            console.log('END Calculations at ' + new Date());
            $('#stop').prop('disabled', true).addClass('btn-secondary').removeClass('btn-success');
            $('#start').prop('disabled', false).addClass('btn-danger').removeClass('btn-secondary');
        });

        /*******************************/
        /* End Manage actions on page */
        /*****************************/

        // Table initialisation
        let resultTable = null;
        result_id = 0;

        // Prepare stage templating
        let stageTPL = null;
        $.get('tpl/stages.mst', function (data) {
            stageTPL = data;
        }, 'text');
        let cuTPL = null;
        $.get('tpl/cu.mst', function (data) {
            cuTPL = data;
        }, 'text');
        let cuHTML = null;

        /********************************/
        /********************************/
        /**                            **/
        /** Start Processing on submit **/
        /**                            **/
        /********************************/
        /********************************/

        $('#param').submit(function (event) {
            // Prevent default
            event.preventDefault();

            // Counters
            config_count = 0;
            valid_count = 0;
            result_id = 0;

            // Set Start Time
            let startTime = new Date();

            // Manage Start / Stop buttons
            $('#start').prop('disabled', true).addClass('btn-secondary').removeClass('btn-danger');
            $('#stop').prop('disabled', false).addClass('btn-success').removeClass('btn-secondary');

            $('#results').show();

            // If table not prepared, init it
            if (resultTable === null) {

                resultTable = $('#results table').DataTable({
                    searching: false,
                    language: {
                        emptyTable: "No configuration found from your specifications"
                    },
                    order: [[3, "desc"]],
                    columnDefs: [
                        { width: 50, targets: 0 },
                        { width: 100, targets: [1, 2, 3,4 ,5 ,6] }

                    ],
                    fixedColumns: true
                });
            }
            resultTable.clear().draw();

            // Get form values
            let elems = event.currentTarget.elements;
            let collection_name = '';

            // Filter parts
            let part_mode = elems.part_mode.value;
            SelectedParts = {};
            if (part_mode === 'part_collection_simple') {
                collection_name = elems.parts_collection.value;
                if (collection_name !== 'all') {
                    for (let part_group in Parts) {
                        SelectedParts[part_group] = [];
                        for (let part_id in Parts[part_group]) {
                            if (Parts[part_group][part_id].provider === collection_name) {
                                SelectedParts[part_group].push(clone(Parts[part_group][part_id]));
                            }
                        }
                    }
                }
                else {
                    SelectedParts = clone(Parts);
                }
            }
            else {
                $.each(elems.partList, function (i, item) {
                    if ($(item).prop('checked')) {
                        let box = $(this).val().split('--');
                        if (!collection[box[0]]) {
                            collection[box[0]] = {};
                        }
                        collection[box[0]][box[1]] = box[1];
                    }
                });
                for (let part_category in Parts) {
                    SelectedParts[part_category] = [];
                    for (let key in Parts[part_category]) {
                        let part = Parts[part_category][key];
                        if (collection[part_category] && collection[part_category][part.id]) {
                            SelectedParts[part_category].push(clone(Parts[part_category][key]));
                        }
                    }
                }
            }

            /******************************/
            /* Init calculation variables */
            /******************************/

            let CU = {};
            CU.mass = parseFloat(elems.Mu.value);
            CU.size = elems.sizeCU.value;

            let rocket = {};
            rocket.dv = {
                target: parseFloat(elems.DvTarget.value),
            };
            rocket.type = elems.type.value;
            rocket.stages = parseInt(elems.nbStage.value);
            rocket.twr = {
                min: parseFloat(elems.Tmin.value),
                max: (elems.Tmax.value != '') ? parseFloat(elems.Tmax.value) : undefined,
                spread: parseFloat(elems.Tspread.value),
            };
            let debug_status = elems.debug.checked;
            let nbWorkers = parseInt(elems.nbworker.value);

            let simu = {};
            simu.nbWorker = nbWorkers;
          //  simu.step = parseInt(elems.Step.value);
            simu.maxTanks = parseInt(elems.nbTanks.value);
            simu.maxRadial = parseInt(elems.nbRadial.value);
            simu.debug = {};
            simu.debug.status = debug_status;
            simu.debug.startTime = startTime.getTime();

            let soi = elems.soi.value;
            let trajectory = 'basic';
            computationData = {
                SOI: SOI[soi],
                trajectory: trajectories[soi][trajectory],
                rocket: rocket,
                cu: CU,
                simu: simu,
            };

            PartToCalculation.decouplers = SelectedParts.decouplers;
            PartToCalculation.engines = [];

            /**********************************/
            /* End Init calculation variables */
            /**********************************/

            // Init HTML of CU
            cuHTML = makeCuHtml(CU, Sizes);

            // Log Starting
            console.log('Start Calculations at ' + startTime);
            /*
             console.log('###################');
             console.log('input data');
             console.log(computationData);
             console.log('###################');
             */

            // Show table
            $('html, body').animate({
                scrollTop: $("#results").offset().top
            }, 1000);

            $('#message').html(
                "Nikolai Kuznetsov provides us <span class='nb_engines'>0</span> engines.<br/>" +
                "Sergeï Kerolev provides us <span class='nb_fuel'>0</span> fuels stacks"
            );


            console.group('Part Stack generation');
            console.log('stating ' + new Date());
            let engineWorkerStatus = 'created';
            let fuelTankWorkerStatus = 'created';

            // Generate Engine Stacks
            let engineWorker = new Worker("workers/makeEngineStack.js");
            engineWorker.postMessage({
                channel: 'create',
                parts: SelectedParts,
                debug: computationData.simu.debug,
                radials: computationData.simu.maxRadial,
            });
            engineWorker.addEventListener('message', function (e) {
                let result = e.data;
                let channel = result.channel;
                if (channel === 'nb') {
                    let nb = result.nb;
                    $('#message .nb_engines').html(nb);
                }
                if (channel === 'results') {
                    PartToCalculation.engines = result.results;
                    engineWorkerStatus = undefined;
                    engineWorker.postMessage({ channel: "stop" });
                    console.log('finishing Engine stack generation');
                    //console.log(result.results);
                    // If engine worker has already finished.
                    if(fuelTankWorkerStatus === undefined) {
                        makeStages();
                    }
                }

            });
            console.log('starting Engine stack generation');
            engineWorker.postMessage({ channel: "run" });

            // Generate Fuel Tank Stacks
            let fuelTankWorker = new Worker("workers/makeFuelStack.js");
            fuelTankWorker.postMessage({
                channel: 'create',
                parts: SelectedParts,
                debug: computationData.simu.debug,
                maxTanks: computationData.simu.maxTanks,
            });
            fuelTankWorker.addEventListener('message', function (e) {
                let result = e.data;
                let channel = result.channel;
                if (channel === 'nb') {
                    let nb = result.nb;
                    $('#message .nb_fuel').html(nb);
                }
                if (channel === 'results') {
                    PartToCalculation.fuelable = result.results;
                    fuelTankWorkerStatus = undefined;
                    fuelTankWorker.postMessage({ channel: "stop" });
                    //console.log(result.results);
                    console.log('finishing fuel tank stack generation');
                    // If engine worker has already finished.
                    if(engineWorkerStatus === undefined) {
                        makeStages();
                    }
                }
            });
            console.log('starting fuel tank stack generation');
            fuelTankWorker.postMessage({ channel: "run" });

        });

        function makeStages() {

            console.log('finishing ' + new Date());
            console.groupEnd();

            // Launch workers !
            searchRockets();

            // Prevent default
            return false;
        }


        /**********************/
        /* Running Operations */
        /**********************/

        // Search all rockets
        function searchRockets() {
            $('#message').html("Let's see Nikolai Kuznetsov & Serguei Kebolev working together");
            console.log('Search Rockets '  + new Date());

            master = new Worker("workers/master.js");
            let master_id = "master";

            let master_data = clone(computationData);
            master.postMessage({
                channel: 'create',
                parts: PartToCalculation,
                id: master_id,
                debug: computationData.simu.debug
            });

            master.addEventListener('message', function (e) {
                let result = e.data;
                let channel = result.channel;
                if (channel === 'result') {
                    //console.log(e.data.output);
                    let dataToTable = e.data.rocket;
                    dataToTable.cu = computationData.cu;
                    dataToTable.cuHTML = cuHTML;
                    valid_count++;
                    updateDom(dataToTable);
                }
                if (channel === 'wait') {
                    let master_id = result.id;
                    // If Master has end all is processing, kill it
                    DEBUG.send(master_id + ' # Send wait');
                    master.postMessage({ channel: 'stop' });
                }
                if (channel === 'badDesign') {
                    updateCounter();
                }
                if (channel === 'killMe') {
                    let id_to_kill = result.id;
                    DEBUG.send(id_to_kill + ' # END');
                    master = undefined;
                    console.log('END Calculations at ' + new Date());
                    $('#stop').prop('disabled', true).addClass('btn-secondary').removeClass('btn-success');
                    $('#start').prop('disabled', false).addClass('btn-danger').removeClass('btn-secondary');
                }
            });
            master.postMessage({ channel: "run", data: master_data });
        }


        // Add a row in table
        function updateDom(data) {
            result_id++;
            let mass = round(data.totalMass + data.cu.mass);
            let nbStages = data.nbStages;
            let dv = round(data.totalDv, 2);
            let Cu_part = round(round(data.cu.mass / mass, 4) * 100, 2);
            let count = data.nb;
            let cost = data.cost;
            let StagesHTML = '<div class="stagesDetails">';
            StagesHTML += data.cuHTML;
            StagesHTML += printStages(data.stages, mass, dv, result_id);
            StagesHTML += "</div>";

            resultTable.row.add([result_id, nbStages, mass, Cu_part, dv, count, cost, StagesHTML]);

            // Delay table update
            if (waitDraw === false) {
                setTimeout( function() {resultTable.draw(); waitDraw=false}, 500);
                waitDraw = true;
                updateCounter();
            }
        }

        // Render stage to table
        function printStages(stages, fullMass, fullDv, result_id) {
            let output = '';
            for (let i in stages) {
                let stage = stages[i];
                let stageData = {};
                stageData.resultId = result_id;
                stageData.stage_id = parseInt(i) + 1;
                stageData.stageDv = round(stage.caracts.stageDv);
                stageData.FullDv = round(fullDv);
                stageData.MassLauncher = round(fullMass);
                stageData.burn = round(stage.caracts.burn);
                stageData.twrMax = round(stage.caracts.twr.max);
                stageData.twrMin = round(stage.caracts.twr.min);
                stageData.totalMass = round(stage.caracts.mass.full);

                stageData.decoupler = stage.parts.decoupler;
                stageData.engine = stage.parts.engine;
                //console.log( stage.parts.tanks);
                stageData.tanks = [];
                let tanks = stage.parts.tanks;
                for (let j in tanks) {
                    let tank = tanks[j];
                    if(tank.name === undefined) {
                        continue;
                    }
                    if(tank.nb === undefined) {
                        tank.nb = 1;
                    }
                    stageData.tanks.push({ tank_name: tank.name, tank_nb : tank.nb});
                }
                stageData.command = [];
                let command = stage.parts.commandModule;
                for (let k in command) {
                    let part = command[k];
                    stageData.command.push({ part_name: part.name });
                }
                let rendered = Mustache.render(stageTPL, stageData);
                output += rendered;
            }

            return output;
        }

        // Render CU stage
        function makeCuHtml(cu, sizes) {
            let output = '';

            let cuData = {};
            cuData.mass = cu.mass;
            cuData.size = '';
            for (let i in sizes) {
                if (sizes[i].id === cu.size) {
                    cuData.size = sizes[i].label;
                }
            }

            let rendered = Mustache.render(cuTPL, cuData);
            output += rendered;

            return output;
        }

        function updateCounter() {
            config_count++;
            let message = valid_count + " valid configrations among " + config_count + " tested.";
            $('#message').html(message);
        }

    });
})(jQuery);

// Load parts
console.log("Load Parts");
for (let partTypesKey in partTypes) {

    Parts[partTypes[partTypesKey]] = [];

    for (let providersKey in providers) {

        fetch('../assets/parts/'+providers[providersKey]+'/'+partTypes[partTypesKey]+'.json')
            .then((response) => {
                if (response.ok) {
                    return response.json()
                }
                else {
                    return Promise.reject(response.status)
                }
            })
            .then((json) => {
                Parts[partTypes[partTypesKey]] = Parts[partTypes[partTypesKey]].concat(json);
                console.log("-- Load " + partTypes[partTypesKey] + " from " + providers[providersKey]);
            })
            .catch(error => {
                if(error === 404) {
                    console.log("-- No part files for "+ partTypes[partTypesKey] + " from " + providers[providersKey]);
                }
                else {
                    console.log("-- error on " + partTypes[partTypesKey] + " from " + providers[providersKey], error);
                }
            });
    }
}

