/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var nopt = require('nopt'),
    path = require('path'),
    fs = require('fs'),
    Collector = require('../collector'),
    formatOption = require('../util/help-formatter').formatOption,
    util = require('util'),
    utils = require('../object-utils'),
    filesFor = require('../util/file-matcher').filesFor,
    Command = require('./index'),
    configuration = require('../config');

function isAbsolute(file) {
    if (path.isAbsolute) {
        return path.isAbsolute(file);
    }

    return path.resolve(file) === path.normalize(file);
}

function CheckCoverageCommand() {
    Command.call(this);
}

function removeFiles(covObj, root, files) {
    var filesObj = {},
        obj = {};

    // Create lookup table.
    files.forEach(function (file) {
        filesObj[file] = true;
    });

    Object.keys(covObj).forEach(function (key) {
        // Exclude keys will always be relative, but covObj keys can be absolute or relative
        var excludeKey = isAbsolute(key) ? path.relative(root, key) : key;
        // Also normalize for files that start with `./`, etc.
        excludeKey = path.normalize(excludeKey);
        if (filesObj[excludeKey] !== true) {
            obj[key] = covObj[key];
        }
    });

    return obj;
}

CheckCoverageCommand.TYPE = 'check-coverage';
util.inherits(CheckCoverageCommand, Command);

Command.mix(CheckCoverageCommand, {
    synopsis: function () {
        return "checks overall/per-file coverage against thresholds from coverage JSON files. Exits 1 if thresholds are not met, 0 otherwise";
    },

    usage: function () {
        console.error('\nUsage: ' + this.toolName() + ' ' + this.type() + ' <options> [<include-pattern>]\n\nOptions are:\n\n' +
            [
                formatOption('--statements <threshold>', 'global statement coverage threshold'),
                formatOption('--functions <threshold>', 'global function coverage threshold'),
                formatOption('--branches <threshold>', 'global branch coverage threshold'),
                formatOption('--lines <threshold>', 'global line coverage threshold')
            ].join('\n\n') + '\n');

        console.error('\n\n');

        console.error('Thresholds, when specified as a positive number are taken to be the minimum percentage required.');
        console.error('When a threshold is specified as a negative number it represents the maximum number of uncovered entities allowed.\n');
        console.error('For example, --statements 90 implies minimum statement coverage is 90%.');
        console.error('             --statements -10 implies that no more than 10 uncovered statements are allowed\n');
        console.error('Per-file thresholds can be specified via a configuration file.\n');
        console.error('<include-pattern> is a fileset pattern that can be used to select one or more coverage files ' +
            'for merge. This defaults to "**/coverage*.json"');

        console.error('\n');
    },

    run: function (args, callback) {

        var template = {
                config: path,
                root: path,
                statements: Number,
                lines: Number,
                branches: Number,
                functions: Number,
                verbose: Boolean
            },
            opts = nopt(template, { v : '--verbose' }, args, 0),
            // Translate to config opts.
            config = configuration.loadFile(opts.config, {
                verbose: opts.verbose,
                check: {
                    global: {
                        statements: opts.statements,
                        lines: opts.lines,
                        branches: opts.branches,
                        functions: opts.functions
                    }
                }
            }),
            includePattern = '**/coverage*.json',
            root,
            collector = new Collector(),
            errors = [];

        if (opts.argv.remain.length > 0) {
            includePattern = opts.argv.remain[0];
        }

        root = opts.root || process.cwd();
        filesFor({
            root: root,
            includes: [ includePattern ]
        }, function (err, files) {
            if (err) { throw err; }
            if (files.length === 0) {
               return callback('ERROR: No coverage files found.');
            }
            files.forEach(function (file) {
                var coverageObject = JSON.parse(fs.readFileSync(file, 'utf8'));
                collector.add(coverageObject);
            });
            var thresholds = {
                global: {
                    statements: config.check.global.statements || 0,
                    branches: config.check.global.branches || 0,
                    lines: config.check.global.lines || 0,
                    functions: config.check.global.functions || 0,
                    excludes: config.check.global.excludes || []
                },
                each: {
                    statements: config.check.each.statements || 0,
                    branches: config.check.each.branches || 0,
                    lines: config.check.each.lines || 0,
                    functions: config.check.each.functions || 0,
                    excludes: config.check.each.excludes || []
                }
            },
                rawCoverage = collector.getFinalCoverage(),
                globalResults = utils.summarizeCoverage(removeFiles(rawCoverage, root, thresholds.global.excludes)),
                eachResults = removeFiles(rawCoverage, root, thresholds.each.excludes);

            // Summarize per-file results and mutate original results.
            Object.keys(eachResults).forEach(function (key) {
                eachResults[key] = utils.summarizeFileCoverage(eachResults[key]);
            });

            if (config.verbose) {
                console.log('Compare actuals against thresholds');
                console.log(JSON.stringify({ global: globalResults, each: eachResults, thresholds: thresholds }, undefined, 4));
            }

            function check(name, thresholds, actuals) {
                [
                    "statements",
                    "branches",
                    "lines",
                    "functions"
                ].forEach(function (key) {
                    var actual = actuals[key].pct,
                        actualUncovered = actuals[key].total - actuals[key].covered,
                        threshold = thresholds[key];

                    if (threshold < 0) {
                        if (threshold * -1 < actualUncovered) {
                            errors.push('ERROR: Uncovered count for ' + key + ' (' + actualUncovered +
                                ') exceeds ' + name + ' threshold (' + -1 * threshold + ')');
                        }
                    } else {
                        if (actual < threshold) {
                            errors.push('ERROR: Coverage for ' + key + ' (' + actual +
                                '%) does not meet ' + name + ' threshold (' + threshold + '%)');
                        }
                    }
                });
            }

            check("global", thresholds.global, globalResults);

            Object.keys(eachResults).forEach(function (key) {
                check("per-file" + " (" + key + ") ", thresholds.each, eachResults[key]);
            });

            return callback(errors.length === 0 ? null : errors.join("\n"));
        });
    }
});

module.exports = CheckCoverageCommand;


