/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Factory = require('../util/factory'),
    factory = new Factory('report', __dirname, false);
/**
 * An abstraction for producing coverage reports.
 * This class is both the base class as well as a factory for `Report` implementations.
 * All reports are event emitters and are expected to emit a `done` event when
 * the report writing is complete.
 *
 * See also the `Reporter` class for easily producing multiple coverage reports
 * with a single call.
 *
 * Usage
 * -----
 *
 *      var Report = require('istanbul').Report,
 *          report = Report.create('html'),
 *          collector = new require('istanbul').Collector;
 *
 *      collector.add(coverageObject);
 *      report.on('done', function () { console.log('done'); });
 *      report.writeReport(collector);
 *
 * @class Report
 * @module report
 * @main report
 * @constructor
 * @protected
 * @param {Object} options Optional. The options supported by a specific store implementation.
 */
function Report(/* options */) {
    EventEmitter.call(this);
}

util.inherits(Report, EventEmitter);

//add register, create, mix, loadAll, getReportList as class methods
factory.bindClassMethods(Report);

/**
 * registers a new report implementation.
 * @method register
 * @static
 * @param {Function} constructor the constructor function for the report. This function must have a
 *  `TYPE` property of type String, that will be used in `Report.create()`
 */
/**
 * returns a report implementation of the specified type.
 * @method create
 * @static
 * @param {String} type the type of report to create
 * @param {Object} opts Optional. Options specific to the report implementation
 * @return {Report} a new store of the specified type
 */
/**
 * returns the list of available reports as an array of strings
 * @method getReportList
 * @static
 * @return an array of supported report formats
 */

var proto = {
    /**
     * returns a one-line summary of the report
     * @method synopsis
     * @return {String} a description of what the report is about
     */
    synopsis: function () {
        throw new Error('synopsis must be overridden');
    },
    /**
     * returns a config object that has override-able keys settable via config
     * @method getDefaultConfig
     * @return {Object|null} an object representing keys that can be overridden via
     *  the istanbul configuration where the values are the defaults used when
     *  not specified. A null return implies no config attributes
     */
    getDefaultConfig: function () {
        return null;
    },
    /**
     * writes the report for a set of coverage objects added to a collector.
     * @method writeReport
     * @param {Collector} collector the collector for getting the set of files and coverage
     * @param {Boolean} sync true if reports must be written synchronously, false if they can be written using asynchronous means (e.g. stream.write)
     */
    writeReport: function (/* collector, sync */) {
        throw new Error('writeReport: must be overridden');
    }
};

Object.keys(proto).forEach(function (k) {
    Report.prototype[k] = proto[k];
});

module.exports = Report;


