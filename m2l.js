
// Global Variables
var computationData = {};
var PartToCalculation = {};
PartToCalculation.decouplers = [];
PartToCalculation.engines = [];
PartToCalculation.fuelable = [];
var collection = {};
var SelectedParts = {};

// Initialize variables
var config_count = 0;
var valid_count = 0;
var result_id = 0;
var GeneratedStackCollection = 'all';
var GeneratedStackSize = 0;

// Init worker variable
var master;

// Main Wrapper
(function ($) {

    // If Document Ready
    $(document).ready(function () {

        /******************/
        /* Populate items */
        /******************/

        // Populate CU size select
        $.each(Sizes, function (i, item) {
            var data = {
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
            var data = {
                value: item,
                text: item
            };
            $('#parts').append($('<option>', data));
        });

        // Populate "SOI"
        $.each(SOI, function (i, item) {
            var data = {
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
        var domParent = '#advanced_part_list';
        // wait data gathering.
        setTimeout(() => {
            $.get('../tpl/partList.mst', function (data) {
                var partListTpl = data;

                // Generate Advanced part selection
                for (var category in Parts) {
                    part_category = [];
                    for (var part_item in Parts[category]) {
                        var part = Parts[category][part_item];
                        part_category.push({ name: part.name, id: part.id, provider: part.provider });
                    }

                    var html = Mustache.render(partListTpl, { category: category, parts: part_category });
                    $(domParent).append(html);
                }

                // Add interactions on advanced part selection
                $('.part-category').click(function () {
                    var ref = $(this).attr('data-ref');
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
            var check = $(this).prop('checked');

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
        });

        // Binding Stop button
        $('#stop').click(function () {
            // Kill Calculation
            master.terminate();
            console.log('END Calculations at ' + new Date());
            $('#stop').prop('disabled', true);
            $('#start').prop('disabled', false);
            $('#start').addClass('btn-danger').removeClass('btn-secondary');
            $('#stop').addClass('btn-secondary').removeClass('btn-success');
        });

        /*******************************/
        /* End Manage actions on page */
        /*****************************/

        // Table initialisation
        var resultTable = null;
        result_id = 0;

        // Prepare stage templating
        var stageTPL = null;
        $.get('tpl/stages.mst', function (data) {
            stageTPL = data;
        }, 'text');
        var cuTPL = null;
        $.get('tpl/cu.mst', function (data) {
            cuTPL = data;
        }, 'text');
        var cuHTML = null;

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
            var startTime = new Date();

            // Manage Start / Stop buttons
            $('#start').prop('disabled', true);
            $('#stop').prop('disabled', false);
            $('#start').addClass('btn-secondary').removeClass('btn-danger');
            $('#stop').addClass('btn-success').removeClass('btn-secondary');

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
            var elems = event.currentTarget.elements;
            var collection_name = '';

            // Filter parts
            var part_mode = elems.part_mode.value;
            SelectedParts = {};
            if (part_mode == 'part_collection_simple') {
                collection_name = elems.parts_collection.value;
                if (collection_name != 'all') {
                    for (var part_group in Parts) {
                        SelectedParts[part_group] = [];
                        for (var part_id in Parts[part_group]) {
                            if (getKeys(Parts[part_group][part_id].provider)[0] == collection_name) {
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
                collection_name = 'custom';
                $.each(elems.partList, function (i, item) {
                    if ($(item).prop('checked')) {
                        var box = $(this).val().split('--');
                        if (!collection[box[0]]) {
                            collection[box[0]] = {};
                        }
                        collection[box[0]][box[1]] = box[1];
                    }
                });
                for (var part_category in Parts) {
                    SelectedParts[part_category] = [];
                    for (var key in Parts[part_category]) {
                        var part = Parts[part_category][key];
                        if (collection[part_category] && collection[part_category][part.id]) {
                            SelectedParts[part_category].push(clone(Parts[part_category][key]));
                        }
                    }
                }
            }

            /******************************/
            /* Init calculation variables */
            /******************************/

            var CU = {};
            CU.mass = parseFloat(elems.Mu.value);
            CU.size = elems.sizeCU.value;

            var rocket = {};
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
            var debug_status = elems.debug.checked;
            var nbWorkers = parseInt(elems.nbworker.value);

            var simu = {};
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
                var result = e.data;
                var channel = result.channel;
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
                var result = e.data;
                var channel = result.channel;
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
            var master_id = "master";

            var master_data = clone(computationData);
            master.postMessage({
                channel: 'create',
                parts: PartToCalculation,
                id: master_id,
                debug: computationData.simu.debug
            });

            master.addEventListener('message', function (e) {
                var result = e.data;
                var channel = result.channel;
                if (channel === 'result') {
                    //console.log(e.data.output);
                    var dataToTable = e.data.rocket;
                    dataToTable.cu = computationData.cu;
                    dataToTable.cuHTML = cuHTML;
                    valid_count++;
                    updateDom(dataToTable);
                }
                if (channel === 'wait') {
                    var master_id = result.id;
                    // If Master has end all is processing, kill it
                    DEBUG.send(master_id + ' # Send wait');
                    master.postMessage({ channel: 'stop' });
                }
                if (channel === 'badDesign') {
                    updateCounter();
                }
                if (channel === 'killMe') {
                    var id_to_kill = result.id;
                    DEBUG.send(id_to_kill + ' # END');
                    master = undefined;
                    console.log('END Calculations at ' + new Date());
                    $('#stop').prop('disabled', true);
                    $('#start').prop('disabled', false);
                    $('#start').addClass('btn-danger').removeClass('btn-secondary');
                    $('#stop').addClass('btn-secondary').removeClass('btn-success');
                }
            });
            master.postMessage({ channel: "run", data: master_data });
        }


        // Add a row in table
        function updateDom(data) {
            result_id++;
            var mass = round(data.totalMass + data.cu.mass);
            var nbStages = data.nbStages;
            var dv = round(data.totalDv, 2);
            var Cu_part = round(round(data.cu.mass / mass, 4) * 100, 2);
            var count = data.nb;
            var cost = data.cost;
            var StagesHTML = '<div class="stagesDetails">';
            StagesHTML += data.cuHTML;
            StagesHTML += printStages(data.stages, mass, dv, result_id);
            StagesHTML += "</div>";

            resultTable.row.add([result_id, nbStages, mass, Cu_part, dv, count, cost, StagesHTML]).draw();
            updateCounter();
        }

        // Render stage to table
        function printStages(stages, fullMass, fullDv, result_id) {
            var output = '';
            for (var i in stages) {
                var stage = stages[i];
                var stageData = {};
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
                var tanks = stage.parts.tanks;
                for (var j in tanks) {
                    var tank = tanks[j];
                    if(tank.name === undefined) {
                        continue;
                    }
                    if(tank.nb === undefined) {
                        tank.nb = 1;
                    }
                    stageData.tanks.push({ tank_name: tank.name, tank_nb : tank.nb});
                }
                stageData.command = [];
                var command = stage.parts.commandModule;
                for (var k in command) {
                    var part = command[k];
                    stageData.command.push({ part_name: part.name });
                }
                var rendered = Mustache.render(stageTPL, stageData);
                output += rendered;
            }

            return output;
        }

        // Render CU stage
        function makeCuHtml(cu, sizes) {
            var output = '';

            var cuData = {};
            cuData.mass = cu.mass;
            cuData.size = '';
            for (var i in sizes) {
                if (sizes[i].id === cu.size) {
                    cuData.size = sizes[i].label;
                }
            }

            var rendered = Mustache.render(cuTPL, cuData);
            output += rendered;

            return output;
        }

        function updateCounter() {
            config_count++;
            var message = valid_count + " valid configrations among " + config_count + " tested.";
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

