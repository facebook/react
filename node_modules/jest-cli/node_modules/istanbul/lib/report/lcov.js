/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    util = require('util'),
    mkdirp = require('mkdirp'),
    Report = require('./index'),
    LcovOnlyReport = require('./lcovonly'),
    HtmlReport = require('./html');

/**
 * a `Report` implementation that produces an LCOV coverage file and an associated HTML report from coverage objects.
 * The name and behavior of this report is designed to ease migration for projects that currently use `yuitest_coverage`
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('lcov');
 *
 *
 * @class LcovReport
 * @extends Report
 * @module report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to the `lcov.info` file.
 *  HTML files are written in a subdirectory called `lcov-report`. Defaults to `process.cwd()`
 */
function LcovReport(opts) {
    Report.call(this);
    opts = opts || {};
    var baseDir = path.resolve(opts.dir || process.cwd()),
        htmlDir = path.resolve(baseDir, 'lcov-report');

    mkdirp.sync(baseDir);
    this.lcov = new LcovOnlyReport({ dir: baseDir, watermarks: opts.watermarks });
    this.html = new HtmlReport({ dir: htmlDir, watermarks: opts.watermarks, sourceStore: opts.sourceStore});
}

LcovReport.TYPE = 'lcov';
util.inherits(LcovReport, Report);

Report.mix(LcovReport, {
    synopsis: function () {
        return 'combined lcovonly and html report that generates an lcov.info file as well as HTML';
    },
    writeReport: function (collector, sync) {
        var handler = this.handleDone.bind(this);
        this.inProgress = 2;
        this.lcov.on('done', handler);
        this.html.on('done', handler);
        this.lcov.writeReport(collector, sync);
        this.html.writeReport(collector, sync);
    },
    handleDone: function () {
        this.inProgress -= 1;
        if (this.inProgress === 0) {
            this.emit('done');
        }
    }
});

module.exports = LcovReport;
