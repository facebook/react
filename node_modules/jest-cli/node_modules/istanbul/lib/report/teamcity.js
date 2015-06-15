/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    util = require('util'),
    mkdirp = require('mkdirp'),
    fs = require('fs'),
    utils = require('../object-utils'),
    Report = require('./index');

/**
 * a `Report` implementation that produces system messages interpretable by TeamCity.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('teamcity');
 *
 * @class TeamcityReport
 * @extends Report
 * @module report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to the text coverage report will be written, when writing to a file
 * @param {String} [opts.file] the filename for the report. When omitted, the report is written to console
 */
function TeamcityReport(opts) {
    Report.call(this);
    opts = opts || {};
    this.dir = opts.dir || process.cwd();
    this.file = opts.file;
}

TeamcityReport.TYPE = 'teamcity';
util.inherits(TeamcityReport, Report);

function lineForKey(value, teamcityVar) {
    return '##teamcity[buildStatisticValue key=\'' + teamcityVar + '\' value=\'' + value + '\']';
}

Report.mix(TeamcityReport, {
    synopsis: function () {
        return 'report with system messages that can be interpreted with TeamCity';
    },
    getDefaultConfig: function () {
        return { file: null };
    },
    writeReport: function (collector /*, sync */) {
        var summaries = [],
            finalSummary,
            lines = [],
            text;

        collector.files().forEach(function (file) {
            summaries.push(utils.summarizeFileCoverage(collector.fileCoverageFor(file)));
        });

        finalSummary = utils.mergeSummaryObjects.apply(null, summaries);

        lines.push('');
        lines.push('##teamcity[blockOpened name=\'Code Coverage Summary\']');

        //Statements Covered
        lines.push(lineForKey(finalSummary.statements.pct, 'CodeCoverageB'));

        //Methods Covered
        lines.push(lineForKey(finalSummary.functions.covered, 'CodeCoverageAbsMCovered'));
        lines.push(lineForKey(finalSummary.functions.total, 'CodeCoverageAbsMTotal'));
        lines.push(lineForKey(finalSummary.functions.pct, 'CodeCoverageM'));

        //Lines Covered
        lines.push(lineForKey(finalSummary.lines.covered, 'CodeCoverageAbsLCovered'));
        lines.push(lineForKey(finalSummary.lines.total, 'CodeCoverageAbsLTotal'));
        lines.push(lineForKey(finalSummary.lines.pct, 'CodeCoverageL'));

        lines.push('##teamcity[blockClosed name=\'Code Coverage Summary\']');

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

module.exports = TeamcityReport;
