/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var util = require('util'),
    Report = require('./index');

/**
 * a `Report` implementation that does nothing. Use to specify that no reporting
 * is needed.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('none');
 *
 *
 * @class NoneReport
 * @extends Report
 * @module report
 * @constructor
 */
function NoneReport() {
    Report.call(this);
}

NoneReport.TYPE = 'none';
util.inherits(NoneReport, Report);

Report.mix(NoneReport, {
    synopsis: function () {
        return 'Does nothing. Useful to override default behavior and suppress reporting entirely';
    },
    writeReport: function (/* collector, sync */) {
        //noop
        this.emit('done');
    }
});

module.exports = NoneReport;
