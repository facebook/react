// Load modules

var Http = require('http');
var Hoek = require('hoek');


// Declare internals

var internals = {};


exports.wrap = function (error, statusCode, message) {

    Hoek.assert(error instanceof Error, 'Cannot wrap non-Error object');
    return (error.isBoom ? error : internals.initialize(error, statusCode || 500, message));
};


exports.create = function (statusCode, message, data) {

    var error = new Error(message ? message : undefined);       // Avoids settings null message
    error.data = data || null;
    internals.initialize(error, statusCode);
    return error;
};


internals.initialize = function (error, statusCode, message) {

    var numberCode = parseInt(statusCode, 10);
    Hoek.assert(!isNaN(numberCode) && numberCode >= 400, 'First argument must be a number (400+):', statusCode);

    error.isBoom = true;
    error.isServer = numberCode >= 500;

    if (!error.hasOwnProperty('data')) {
        error.data = null;
    }

    error.output = {
        statusCode: numberCode,
        payload: {},
        headers: {}
    };

    error.reformat = internals.reformat;
    error.reformat();

    if (!message &&
        !error.message) {

        message = error.output.payload.error;
    }

    if (message) {
        error.message = (message + (error.message ? ': ' + error.message : ''));
    }

    return error;
};


internals.reformat = function () {

    this.output.payload.statusCode = this.output.statusCode;
    this.output.payload.error = Http.STATUS_CODES[this.output.statusCode] || 'Unknown';

    if (this.output.statusCode === 500) {
        this.output.payload.message = 'An internal server error occurred';              // Hide actual error from user
    }
    else if (this.message) {
        this.output.payload.message = this.message;
    }
};


// 4xx Client Errors

exports.badRequest = function (message, data) {

    return exports.create(400, message, data);
};


exports.unauthorized = function (message, scheme, attributes) {          // Or function (message, wwwAuthenticate[])

    var err = exports.create(401, message);

    if (!scheme) {
        return err;
    }

    var wwwAuthenticate = '';
    var i = 0;
    var il = 0;

    if (typeof scheme === 'string') {

        // function (message, scheme, attributes)

        wwwAuthenticate = scheme;

        if (attributes || message) {
            err.output.payload.attributes = {};
        }

        if (attributes) {
            var names = Object.keys(attributes);
            for (i = 0, il = names.length; i < il; ++i) {
                var name = names[i];
                if (i) {
                    wwwAuthenticate += ',';
                }

                var value = attributes[name];
                if (value === null ||
                    value === undefined) {              // Value can be zero

                    value = '';
                }
                wwwAuthenticate += ' ' + name + '="' + Hoek.escapeHeaderAttribute(value.toString()) + '"';
                err.output.payload.attributes[name] = value;
            }
        }

        if (message) {
            if (attributes) {
                wwwAuthenticate += ',';
            }
            wwwAuthenticate += ' error="' + Hoek.escapeHeaderAttribute(message) + '"';
            err.output.payload.attributes.error = message;
        }
        else {
            err.isMissing = true;
        }
    }
    else {

        // function (message, wwwAuthenticate[])

        var wwwArray = scheme;
        for (i = 0, il = wwwArray.length; i < il; ++i) {
            if (i) {
                wwwAuthenticate += ', ';
            }

            wwwAuthenticate += wwwArray[i];
        }
    }

    err.output.headers['WWW-Authenticate'] = wwwAuthenticate;

    return err;
};


exports.forbidden = function (message, data) {

    return exports.create(403, message, data);
};


exports.notFound = function (message, data) {

    return exports.create(404, message, data);
};


exports.methodNotAllowed = function (message, data) {

    return exports.create(405, message, data);
};


exports.notAcceptable = function (message, data) {

    return exports.create(406, message, data);
};


exports.proxyAuthRequired = function (message, data) {

    return exports.create(407, message, data);
};


exports.clientTimeout = function (message, data) {

    return exports.create(408, message, data);
};


exports.conflict = function (message, data) {

    return exports.create(409, message, data);
};


exports.resourceGone = function (message, data) {

    return exports.create(410, message, data);
};


exports.lengthRequired = function (message, data) {

    return exports.create(411, message, data);
};


exports.preconditionFailed = function (message, data) {

    return exports.create(412, message, data);
};


exports.entityTooLarge = function (message, data) {

    return exports.create(413, message, data);
};


exports.uriTooLong = function (message, data) {

    return exports.create(414, message, data);
};


exports.unsupportedMediaType = function (message, data) {

    return exports.create(415, message, data);
};


exports.rangeNotSatisfiable = function (message, data) {

    return exports.create(416, message, data);
};


exports.expectationFailed = function (message, data) {

    return exports.create(417, message, data);
};

exports.badData = function (message, data) {

    return exports.create(422, message, data);
};


exports.tooManyRequests = function (message, data) {

    return exports.create(429, message, data);
};


// 5xx Server Errors

exports.internal = function (message, data, statusCode) {

    var error = (data instanceof Error ? exports.wrap(data, statusCode, message) : exports.create(statusCode || 500, message));

    if (data instanceof Error === false) {
        error.data = data;
    }

    return error;
};


exports.notImplemented = function (message, data) {

    return exports.internal(message, data, 501);
};


exports.badGateway = function (message, data) {

    return exports.internal(message, data, 502);
};


exports.serverTimeout = function (message, data) {

    return exports.internal(message, data, 503);
};


exports.gatewayTimeout = function (message, data) {

    return exports.internal(message, data, 504);
};


exports.badImplementation = function (message, data) {

    var err = exports.internal(message, data, 500);
    err.isDeveloperError = true;
    return err;
};
