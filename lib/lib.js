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

/*******************************/
/** method array.equal(array) **/
/*******************************/
// Warn if overriding existing method
if (Array.prototype.equals) {
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");

}
else {

    // attach the .equals method to Array's prototype to call it on any array
    Array.prototype.equals = function (array) {
        // if the other array is a falsy value, return
        if (!array)
            return false;

        // compare lengths - can save a lot of time 
        if (this.length != array.length)
            return false;

        for (var i = 0, l = this.length; i < l; i++) {
            // Check if we have nested arrays
            if (this[i] instanceof Array && array[i] instanceof Array) {
                // recurse into the nested arrays
                if (!this[i].equals(array[i]))
                    return false;
            }
            else if (this[i] != array[i]) {
                // Warning - two different object instances will never be equal: {x:20} != {x:20}
                return false;
            }
        }
        return true;
    };
    // Hide method from for-in loops
    Object.defineProperty(Array.prototype, "equals", { enumerable: false });

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

