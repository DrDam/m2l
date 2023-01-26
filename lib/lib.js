
"use strict";

/**
 * General Debug object
 */
var DEBUG = {
    start: 0,
    debug_status: false,
    setStatus: function (debug_status) {
        self.debug_status = debug_status;
    },
    setStart: function (startDate) {
        self.start = startDate;

    },
    send: function (message, title) {
        if (self.debug_status === true) {
            let timestamp = new Date().getTime();
            let delta = round((timestamp - self.start) / 1000, 3);
            if (title === true) {
                delta = 'time';
            }
            console.log(delta + ' # ' + message);
        }
    }
};

/**
 * Create custom round with precision.
 */
function round(number, precision) {
    if (precision === undefined) {
        precision = 2;
    }
    var factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}

/**
 * Filter to arrays.
 * var unique = a.filter(onlyUnique);
 */
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

/**
 * Custom clone command.
 */
function clone(obj) {
    var string = JSON.stringify(obj);
    if (string === undefined) {
        console.trace();
    }
    var copy = JSON.parse(string);
    return copy;
}

/**
 * Custom array comparison function.
 */
function compareSimpleArray(array1, array2) {
    return (array1.sort().join('@@') === array2.sort().join('@@'));
}

/**
 * Extract keys of an object
 */
function getKeys(obj) {
    var keys = [];
    for (var key in obj) {
        keys.push(key);
    }
    return keys;
}

