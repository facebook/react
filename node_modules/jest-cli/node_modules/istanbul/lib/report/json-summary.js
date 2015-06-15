/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    objectUtils = require('../object-utils'),
    Writer = require('../util/file-writer'),
    util = require('util'),
    Report = require('./index');
/**
 * a `Report` implementation that produces a coverage JSON object with summary info only.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('json-summary');
 *
 *
 * @class JsonSummaryReport
 * @extends Report
 * @module report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to write the `coverage-summary.json` file. Defaults to `process.cwd()`
 */
function JsonSummaryReport(opts) {
    this.opts = opts || {};
    this.opts.dir = this.opts.dir || process.cwd();
    this.opts.file = this.opts.file || this.getDefaultConfig().file;
    this.opts.writer = this.opts.writer || null;
}
JsonSummaryReport.TYPE = 'json-summary';
util.inherits(JsonSummaryReport, Report);

Report.mix(JsonSummaryReport, {
    synopsis: function () {
        return 'prints a summary coverage object as JSON to a file';
    },
    getDefaultConfig: function () {
        return {
            file: 'coverage-summary.json'
        };
    },
    writeReport: function (collector, sync) {
        var outputFile = path.resolve(this.opts.dir, this.opts.file),
            writer = this.opts.writer || new Writer(sync),
            that = this;

        var summaries = [],
            finalSummary;
        collector.files().forEach(function (file) {
            summaries.push(objectUtils.summarizeFileCoverage(collector.fileCoverageFor(file)));
        });
        finalSummary = objectUtils.mergeSummaryObjects.apply(null, summaries);

        writer.on('done', function () { that.emit('done'); });
        writer.writeFile(outputFile, function (contentWriter) {
            contentWriter.println("{");
            contentWriter.write('"total":');
            contentWriter.write(JSON.stringify(finalSummary));

            collector.files().forEach(function (key) {
                contentWriter.println(",");
                contentWriter.write(JSON.stringify(key));
                contentWriter.write(":");
                contentWriter.write(JSON.stringify(objectUtils.summarizeFileCoverage(collector.fileCoverageFor(key))));
            });
            contentWriter.println("}");
        });
        writer.done();
    }
});

module.exports = JsonSummaryReport;
