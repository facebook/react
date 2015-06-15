/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/**
 * utility methods to process coverage objects. A coverage object has the following
 * format.
 *
 *      {
 *          "/path/to/file1.js": { file1 coverage },
 *          "/path/to/file2.js": { file2 coverage }
 *      }
 *
 *  The internals of the file coverage object are intentionally not documented since
 *  it is not a public interface.
 *
 *  *Note:* When a method of this module has the word `File` in it, it will accept
 *  one of the sub-objects of the main coverage object as an argument. Other
 *  methods accept the higher level coverage object with multiple keys.
 *
 * Works on `node` as well as the browser.
 *
 * Usage on nodejs
 * ---------------
 *
 *      var objectUtils = require('istanbul').utils;
 *
 * Usage in a browser
 * ------------------
 *
 * Load this file using a `script` tag or other means. This will set `window.coverageUtils`
 * to this module's exports.
 *
 * @class ObjectUtils
 * @module main
 * @static
 */
(function (isNode) {
    /**
     * adds line coverage information to a file coverage object, reverse-engineering
     * it from statement coverage. The object passed in is updated in place.
     *
     * Note that if line coverage information is already present in the object,
     * it is not recomputed.
     *
     * @method addDerivedInfoForFile
     * @static
     * @param {Object} fileCoverage the coverage object for a single file
     */
    function addDerivedInfoForFile(fileCoverage) {
        var statementMap = fileCoverage.statementMap,
            statements = fileCoverage.s,
            lineMap;

        if (!fileCoverage.l) {
            fileCoverage.l = lineMap = {};
            Object.keys(statements).forEach(function (st) {
                var line = statementMap[st].start.line,
                    count = statements[st],
                    prevVal = lineMap[line];
                if (count === 0 && statementMap[st].skip) { count = 1; }
                if (typeof prevVal === 'undefined' || prevVal < count) {
                    lineMap[line] = count;
                }
            });
        }
    }
    /**
     * adds line coverage information to all file coverage objects.
     *
     * @method addDerivedInfo
     * @static
     * @param {Object} coverage the coverage object
     */
    function addDerivedInfo(coverage) {
        Object.keys(coverage).forEach(function (k) {
            addDerivedInfoForFile(coverage[k]);
        });
    }
    /**
     * removes line coverage information from all file coverage objects
     * @method removeDerivedInfo
     * @static
     * @param {Object} coverage the coverage object
     */
    function removeDerivedInfo(coverage) {
        Object.keys(coverage).forEach(function (k) {
            delete coverage[k].l;
        });
    }

    function percent(covered, total) {
        var tmp;
        if (total > 0) {
            tmp = 1000 * 100 * covered / total + 5;
            return Math.floor(tmp / 10) / 100;
        } else {
            return 100.00;
        }
    }

    function computeSimpleTotals(fileCoverage, property, mapProperty) {
        var stats = fileCoverage[property],
            map = mapProperty ? fileCoverage[mapProperty] : null,
            ret = { total: 0, covered: 0, skipped: 0 };

        Object.keys(stats).forEach(function (key) {
            var covered = !!stats[key],
                skipped = map && map[key].skip;
            ret.total += 1;
            if (covered || skipped) {
                ret.covered += 1;
            }
            if (!covered && skipped) {
                ret.skipped += 1;
            }
        });
        ret.pct = percent(ret.covered, ret.total);
        return ret;
    }

    function computeBranchTotals(fileCoverage) {
        var stats = fileCoverage.b,
            branchMap = fileCoverage.branchMap,
            ret = { total: 0, covered: 0, skipped: 0 };

        Object.keys(stats).forEach(function (key) {
            var branches = stats[key],
                map = branchMap[key],
                covered,
                skipped,
                i;
            for (i = 0; i < branches.length; i += 1) {
                covered = branches[i] > 0;
                skipped = map.locations && map.locations[i] && map.locations[i].skip;
                if (covered || skipped) {
                    ret.covered += 1;
                }
                if (!covered && skipped) {
                    ret.skipped += 1;
                }
            }
            ret.total += branches.length;
        });
        ret.pct = percent(ret.covered, ret.total);
        return ret;
    }
    /**
     * returns a blank summary metrics object. A metrics object has the following
     * format.
     *
     *      {
     *          lines: lineMetrics,
     *          statements: statementMetrics,
     *          functions: functionMetrics,
     *          branches: branchMetrics
     *      }
     *
     *  Each individual metric object looks as follows:
     *
     *      {
     *          total: n,
     *          covered: m,
     *          pct: percent
     *      }
     *
     * @method blankSummary
     * @static
     * @return {Object} a blank metrics object
     */
    function blankSummary() {
        return {
            lines: {
                total: 0,
                covered: 0,
                skipped: 0,
                pct: 'Unknown'
            },
            statements: {
                total: 0,
                covered: 0,
                skipped: 0,
                pct: 'Unknown'
            },
            functions: {
                total: 0,
                covered: 0,
                skipped: 0,
                pct: 'Unknown'
            },
            branches: {
                total: 0,
                covered: 0,
                skipped: 0,
                pct: 'Unknown'
            }
        };
    }
    /**
     * returns the summary metrics given the coverage object for a single file. See `blankSummary()`
     * to understand the format of the returned object.
     *
     * @method summarizeFileCoverage
     * @static
     * @param {Object} fileCoverage the coverage object for a single file.
     * @return {Object} the summary metrics for the file
     */
    function summarizeFileCoverage(fileCoverage) {
        var ret = blankSummary();
        addDerivedInfoForFile(fileCoverage);
        ret.lines = computeSimpleTotals(fileCoverage, 'l');
        ret.functions = computeSimpleTotals(fileCoverage, 'f', 'fnMap');
        ret.statements = computeSimpleTotals(fileCoverage, 's', 'statementMap');
        ret.branches = computeBranchTotals(fileCoverage);
        return ret;
    }
    /**
     * merges two instances of file coverage objects *for the same file*
     * such that the execution counts are correct.
     *
     * @method mergeFileCoverage
     * @static
     * @param {Object} first the first file coverage object for a given file
     * @param {Object} second the second file coverage object for the same file
     * @return {Object} an object that is a result of merging the two. Note that
     *      the input objects are not changed in any way.
     */
    function mergeFileCoverage(first, second) {
        var ret = JSON.parse(JSON.stringify(first)),
            i;

        delete ret.l; //remove derived info

        Object.keys(second.s).forEach(function (k) {
            ret.s[k] += second.s[k];
        });
        Object.keys(second.f).forEach(function (k) {
            ret.f[k] += second.f[k];
        });
        Object.keys(second.b).forEach(function (k) {
            var retArray = ret.b[k],
                secondArray = second.b[k];
            for (i = 0; i < retArray.length; i += 1) {
                retArray[i] += secondArray[i];
            }
        });

        return ret;
    }
    /**
     * merges multiple summary metrics objects by summing up the `totals` and
     * `covered` fields and recomputing the percentages. This function is generic
     * and can accept any number of arguments.
     *
     * @method mergeSummaryObjects
     * @static
     * @param {Object} summary... multiple summary metrics objects
     * @return {Object} the merged summary metrics
     */
    function mergeSummaryObjects() {
        var ret = blankSummary(),
            args = Array.prototype.slice.call(arguments),
            keys = ['lines', 'statements', 'branches', 'functions'],
            increment = function (obj) {
                if (obj) {
                    keys.forEach(function (key) {
                        ret[key].total += obj[key].total;
                        ret[key].covered += obj[key].covered;
                        ret[key].skipped += obj[key].skipped;
                    });
                }
            };
        args.forEach(function (arg) {
            increment(arg);
        });
        keys.forEach(function (key) {
            ret[key].pct = percent(ret[key].covered, ret[key].total);
        });

        return ret;
    }
    /**
     * returns the coverage summary for a single coverage object. This is
     * wrapper over `summarizeFileCoverage` and `mergeSummaryObjects` for
     * the common case of a single coverage object
     * @method summarizeCoverage
     * @static
     * @param {Object} coverage  the coverage object
     * @return {Object} summary coverage metrics across all files in the coverage object
     */
    function summarizeCoverage(coverage) {
        var fileSummary = [];
        Object.keys(coverage).forEach(function (key) {
            fileSummary.push(summarizeFileCoverage(coverage[key]));
        });
        return mergeSummaryObjects.apply(null, fileSummary);
    }

    /**
     * makes the coverage object generated by this library yuitest_coverage compatible.
     * Note that this transformation is lossy since the returned object will not have
     * statement and branch coverage.
     *
     * @method toYUICoverage
     * @static
     * @param {Object} coverage The `istanbul` coverage object
     * @return {Object} a coverage object in `yuitest_coverage` format.
     */
    function toYUICoverage(coverage) {
        var ret = {};

        addDerivedInfo(coverage);

        Object.keys(coverage).forEach(function (k) {
            var fileCoverage = coverage[k],
                lines = fileCoverage.l,
                functions = fileCoverage.f,
                fnMap = fileCoverage.fnMap,
                o;

            o = ret[k] = {
                lines: {},
                calledLines: 0,
                coveredLines: 0,
                functions: {},
                calledFunctions: 0,
                coveredFunctions: 0
            };
            Object.keys(lines).forEach(function (k) {
                o.lines[k] = lines[k];
                o.coveredLines += 1;
                if (lines[k] > 0) {
                    o.calledLines += 1;
                }
            });
            Object.keys(functions).forEach(function (k) {
                var name = fnMap[k].name + ':' + fnMap[k].line;
                o.functions[name] = functions[k];
                o.coveredFunctions += 1;
                if (functions[k] > 0) {
                    o.calledFunctions += 1;
                }
            });
        });
        return ret;
    }

    /**
     * Creates new file coverage object with incremented hits count
     * on skipped statements, branches and functions
     *
     * @method incrementIgnoredTotals
     * @static
     * @param {Object} cov File coverage object
     * @return {Object} New file coverage object
     */
    function incrementIgnoredTotals(cov) {
        //TODO: This may be slow in the browser and may break in older browsers
        //      Look into using a library that works in Node and the browser
        var fileCoverage = JSON.parse(JSON.stringify(cov));

        [
            {mapKey: 'statementMap', hitsKey: 's'},
            {mapKey: 'branchMap', hitsKey: 'b'},
            {mapKey: 'fnMap', hitsKey: 'f'}
        ].forEach(function (keys) {
            Object.keys(fileCoverage[keys.mapKey])
                .forEach(function (key) {
                    var map = fileCoverage[keys.mapKey][key];
                    var hits = fileCoverage[keys.hitsKey];

                    if (keys.mapKey === 'branchMap') {
                        var locations = map.locations;

                        locations.forEach(function (location, index) {
                            if (hits[key][index] === 0 && location.skip) {
                                hits[key][index] = 1;
                            }
                        });

                        return;
                    }

                    if (hits[key] === 0 && map.skip) {
                        hits[key] = 1;
                    }
                });
            });

        return fileCoverage;
    }

    var exportables = {
        addDerivedInfo: addDerivedInfo,
        addDerivedInfoForFile: addDerivedInfoForFile,
        removeDerivedInfo: removeDerivedInfo,
        blankSummary: blankSummary,
        summarizeFileCoverage: summarizeFileCoverage,
        summarizeCoverage: summarizeCoverage,
        mergeFileCoverage: mergeFileCoverage,
        mergeSummaryObjects: mergeSummaryObjects,
        toYUICoverage: toYUICoverage,
        incrementIgnoredTotals: incrementIgnoredTotals
    };

    /* istanbul ignore else: windows */
    if (isNode) {
        module.exports = exportables;
    } else {
        window.coverageUtils = exportables;
    }
}(typeof module !== 'undefined' && typeof module.exports !== 'undefined' && typeof exports !== 'undefined'));

