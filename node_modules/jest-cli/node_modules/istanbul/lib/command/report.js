/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var nopt = require('nopt'),
    Report = require('../report'),
    Reporter = require('../reporter'),
    path = require('path'),
    fs = require('fs'),
    Collector = require('../collector'),
    helpFormatter = require('../util/help-formatter'),
    formatOption = helpFormatter.formatOption,
    formatPara = helpFormatter.formatPara,
    filesFor = require('../util/file-matcher').filesFor,
    util = require('util'),
    Command = require('./index'),
    configuration = require('../config');

function ReportCommand() {
    Command.call(this);
}

ReportCommand.TYPE = 'report';
util.inherits(ReportCommand, Command);

function printDeprecationMessage(pat, fmt) {
    console.error('**********************************************************************');
    console.error('DEPRECATION WARNING! You are probably using the old format of the report command');
    console.error('This will stop working soon, see `istanbul help report` for the new command format');
    console.error('Assuming you meant: istanbul report --include=' + pat + ' ' + fmt);
    console.error('**********************************************************************');
}

Command.mix(ReportCommand, {
    synopsis: function () {
        return "writes reports for coverage JSON objects produced in a previous run";
    },

    usage: function () {
        console.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' <options> [ <format> ... ]\n\nOptions are:\n\n' +
            [
                formatOption('--config <path-to-config>', 'the configuration file to use, defaults to .istanbul.yml'),
                formatOption('--root <input-directory>', 'The input root directory for finding coverage files'),
                formatOption('--dir <report-directory>', 'The output directory where files will be written. This defaults to ./coverage/'),
                formatOption('--include <glob>', 'The fileset pattern to select one or more coverage files, defaults to **/coverage*.json'),
                formatOption('--verbose, -v', 'verbose mode')
            ].join('\n\n'));

        console.error('\n');
        console.error('<format> is one of ');
        Report.getReportList().forEach(function (name) {
           console.error(formatOption(name, Report.create(name).synopsis()));
        });
        console.error("");
        console.error(formatPara([
            'Default format is lcov unless otherwise specified in the config file.',
            'In addition you can tweak the file names for various reports using the config file.',
            'Type `istanbul help config` to see what can be tweaked.'
        ].join(' ')));
        console.error('\n');
    },

    run: function (args, callback) {

        var template = {
                config: path,
                root: path,
                dir: path,
                include: String,
                verbose: Boolean
            },
            opts = nopt(template, { v : '--verbose' }, args, 0),
            includePattern = opts.include || '**/coverage*.json',
            root,
            collector = new Collector(),
            config = configuration.loadFile(opts.config, {
                verbose: opts.verbose,
                reporting: {
                    dir: opts.dir
                }
            }),
            formats = opts.argv.remain,
            reporter = new Reporter(config);

        // Start: backward compatible processing
        if (formats.length === 2 &&
                Report.getReportList().indexOf(formats[1]) < 0) {
            includePattern = formats[1];
            formats = [ formats[0] ];
            printDeprecationMessage(includePattern, formats[0]);
        }
        // End: backward compatible processing

        if (formats.length === 0) {
            formats = config.reporting.reports();
        }
        if (formats.length === 0) {
            formats = [ 'lcov' ];
        }
        reporter.addAll(formats);

        root = opts.root || process.cwd();
        filesFor({
            root: root,
            includes: [ includePattern ]
        }, function (err, files) {
            if (err) { throw err; }
            files.forEach(function (file) {
                var coverageObject =  JSON.parse(fs.readFileSync(file, 'utf8'));
                collector.add(coverageObject);
            });
            reporter.write(collector, false, function (err) {
                console.log('Done');
                return callback(err);
            });
        });
    }
});

module.exports = ReportCommand;


