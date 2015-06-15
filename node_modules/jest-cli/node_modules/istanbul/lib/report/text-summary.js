/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    util = require('util'),
    mkdirp = require('mkdirp'),
    defaults = require('./common/defaults'),
    fs = require('fs'),
    utils = require('../object-utils'),
    Report = require('./index');

/**
 * a `Report` implementation that produces text output for overall coverage in summary format.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('text-summary');
 *
 * @class TextSummaryReport
 * @extends Report
 * @module report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to the text coverage report will be written, when writing to a file
 * @param {String} [opts.file] the filename for the report. When omitted, the report is written to console
 */
function TextSummaryReport(opts) {
    Report.call(this);
    opts = opts || {};
    this.dir = opts.dir || process.cwd();
    this.file = opts.file;
    this.watermarks = opts.watermarks || defaults.watermarks();
}

TextSummaryReport.TYPE = 'text-summary';
util.inherits(TextSummaryReport, Report);

function lineForKey(summary, key, watermarks) {
    var metrics = summary[key],
        skipped,
        result,
        clazz = defaults.classFor(key, summary, watermarks);
    key = key.substring(0, 1).toUpperCase() + key.substring(1);
    if (key.length < 12) { key += '                   '.substring(0, 12 - key.length); }
    result = [ key , ':', metrics.pct + '%', '(', metrics.covered + '/' + metrics.total, ')'].join(' ');
    skipped = metrics.skipped;
    if (skipped > 0) {
        result += ', ' + skipped + ' ignored';
    }
    return defaults.colorize(result, clazz);
}

Report.mix(TextSummaryReport, {
    synopsis: function () {
        return 'text report that prints a coverage summary across all files, typically to console';
    },
    getDefaultConfig: function () {
        return { file: null };
    },
    writeReport: function (collector /*, sync */) {
        var summaries = [],
            finalSummary,
            lines = [],
            watermarks = this.watermarks,
            text;
        collector.files().forEach(function (file) {
            summaries.push(utils.summarizeFileCoverage(collector.fileCoverageFor(file)));
        });
        finalSummary = utils.mergeSummaryObjects.apply(null, summaries);
        lines.push('');
        lines.push('=============================== Coverage summary ===============================');
        lines.push.apply(lines, [
            lineForKey(finalSummary, 'statements', watermarks),
            lineForKey(finalSummary, 'branches', watermarks),
            lineForKey(finalSummary, 'functions', watermarks),
            lineForKey(finalSummary, 'lines', watermarks)
        ]);
        lines.push('================================================================================');
        text = lines.join('\n');
        if (this.file) {
            mkdirp.sync(this.dir);
            fs.writeFileSync(path.join(this.dir, this.file), text, 'utf8');
        } else {
            console.log(text);
        }
        this.emit('done');
    }
});

module.exports = TextSummaryReport;
