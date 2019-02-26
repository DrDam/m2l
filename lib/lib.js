// Debug function
var DEBUG = {
    start: 0,
    status: false,
    setStatus: function (debug_status) {
        status = debug_status;
    },
    setStart: function (startDate) {
        start = startDate;

    },
    send: function (message, title) {
        if (status === true) {
            var timestamp = new Date().getTime();
            var delta = round((timestamp - start) / 1000, 3);
            if (title == true) {
                delta = 'time';
            }
            console.log(delta + ' # ' + message);
        }
    }
};

// Make round number
function round(number, precision) {
    if (precision === undefined) {
        precision = 2;
    }
    var factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
}

// Clone a object
function clone(obj) {
    var string = JSON.stringify(obj);
    if (string === undefined) {
        console.trace();
    }
    var copy = JSON.parse(string);
    return copy;
}

// Merge array
function mergeArray(array1, array2) {
    var output = clone(array1);
    for (var i in array2) {
        output.push(array2[i]);
    }
    return output;
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

// Generate HashCode
String.prototype.hashCode = function () {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

// Extract all attributs of an object
function getKeys(obj) {
    var keys = [];
    for (var key in obj) {
        keys.push(key);
    }
    return keys;
}

/***********/
/* Helpers */
/***********/
// Test TWR
function testTwr(Thrust, Mass, twr_target, Go) {
    var Twr = Thrust / Mass / Go;

    if (!twr_target.max) {
        return Twr > twr_target.min;
    }
    else {
        return (Twr > twr_target.min && Twr < twr_target.max);
    }
}

// Get Estimated Atm Pressur from RestDv
function AtmPressurEstimator(RestDv) {
    if(RestDv >= 3500) return 0;

    // Inject atm modele here
    return Math.ceil(RestDv/3500);
}

// return ISP/thrust of Engine for a AtmPressur
function getCaractForAtm(engineCurve, AtmPressur) {

    // if AtmPressure need is vaccum, return it
    if(AtmPressur == 0) {
        return engineCurve[0];
    }
    else {
        // Else set vac values
        vac_isp = engineCurve[0].ISP;
        vac_thrust = engineCurve[0].Thrust;
    }

    // Atmo curve are atm ascendent
    for(var point in engineCurve) {
        // if AtmPressur > last curve atmo
        if(engineCurve[point].atmo < AtmPressur && typeof engineCurve[point+1] == 'undefined') {
            return engineCurve[point];
        }

        // estimate value for atm pressure
        if(engineCurve[point].atmo < AtmPressur && engineCurve[point+1].atmo > AtmPressur) {
            var atm_diff = engineCurve[point+1].atmo - engineCurve[point].atmo;
            var ISP_deriv = (engineCurve[point+1].ISP - engineCurve[point].ISP) / atm_diff;
            var Thrust_deriv = (engineCurve[point+1].Thrust - engineCurve[point].Thrust) / atm_diff;
            
            var output = {
                atmo:AtmPressur,
                ISP: ISP_deriv * AtmPressur + vac_isp,
                Thrust: Thrust_deriv * AtmPressur + vac_thrust,
            };
            
            return output;
        }
    }

    console.log({'msg':'Error','curve':engineCurve, 'atm':AtmPressur});
}