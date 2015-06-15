'use strict';

var parseMeasurement = require('../parsers').parseMeasurement;

module.exports.definition = {
    set: function (v) {
        this._setProperty('height', parseMeasurement(v));
    },
    get: function () {
        return this.getPropertyValue('height');
    },
    enumerable: true,
    configurable: true
};
