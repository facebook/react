/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    Writer = require('../util/file-writer'),
    util = require('util'),
    Report = require('./index');
/**
 * a `Report` implementation that produces a coverage JSON object.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('json');
 *
 *
 * @class JsonReport
 * @extends Report
 * @module report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to write the `coverage-final.json` file. Defaults to `process.cwd()`
 */
function JsonReport(opts) {
    this.opts = opts || {};
    this.opts.dir = this.opts.dir || process.cwd();
    this.opts.file = this.opts.file || this.getDefaultConfig().file;
    this.opts.writer = this.opts.writer || null;
}
JsonReport.TYPE = 'json';
util.inherits(JsonReport, Report);

Report.mix(JsonReport, {
    synopsis: function () {
        return 'prints the coverage object as JSON to a file';
    },
    getDefaultConfig: function () {
        return {
            file: 'coverage-final.json'
        };
    },
    writeReport: function (collector, sync) {
        var outputFile = path.resolve(this.opts.dir, this.opts.file),
            writer = this.opts.writer || new Writer(sync),
            that = this;

        writer.on('done', function () { that.emit('done'); });
        writer.writeFile(outputFile, function (contentWriter) {
            var first = true;
            contentWriter.println("{");
            collector.files().forEach(function (key) {
                if (first) {
                    first = false;
                } else {
                    contentWriter.println(",");
                }
                contentWriter.write(JSON.stringify(key));
                contentWriter.write(":");
                contentWriter.write(JSON.stringify(collector.fileCoverageFor(key)));
            });
            contentWriter.println("}");
        });
        writer.done();
    }
});

module.exports = JsonReport;
