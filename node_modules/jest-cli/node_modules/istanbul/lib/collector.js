/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
"use strict";
var MemoryStore = require('./store/memory'),
    utils = require('./object-utils');

/**
 * a mechanism to merge multiple coverage objects into one. Handles the use case
 * of overlapping coverage information for the same files in multiple coverage
 * objects and does not double-count in this situation. For example, if
 * you pass the same coverage object multiple times, the final merged object will be
 * no different that any of the objects passed in (except for execution counts).
 *
 * The `Collector` is built for scale to handle thousands of coverage objects.
 * By default, all processing is done in memory since the common use-case is of
 * one or a few coverage objects. You can work around memory
 * issues by passing in a `Store` implementation that stores temporary computations
 * on disk (the `tmp` store, for example).
 *
 * The `getFinalCoverage` method returns an object with merged coverage information
 * and is provided as a convenience for implementors working with coverage information
 * that can fit into memory. Reporters, in the interest of generality, should *not* use this method for
 * creating reports.
 *
 * Usage
 * -----
 *
 *      var collector = new require('istanbul').Collector();
 *
 *      files.forEach(function (f) {
 *          //each coverage object can have overlapping information about multiple files
 *          collector.add(JSON.parse(fs.readFileSync(f, 'utf8')));
 *      });
 *
 *      collector.files().forEach(function(file) {
 *          var fileCoverage = collector.fileCoverageFor(file);
 *          console.log('Coverage for ' + file + ' is:' + JSON.stringify(fileCoverage));
 *      });
 *
 *      // convenience method: do not use this when dealing with a large number of files
 *      var finalCoverage = collector.getFinalCoverage();
 *
 * @class Collector
 * @module main
 * @constructor
 * @param {Object} options Optional. Configuration options.
 * @param {Store} options.store - an implementation of `Store` to use for temporary
 *      calculations.
 */
function Collector(options) {
    options = options || {};
    this.store = options.store || new MemoryStore();
}

Collector.prototype = {
    /**
     * adds a coverage object to the collector.
     *
     * @method add
     * @param {Object} coverage the coverage object.
     * @param {String} testName Optional. The name of the test used to produce the object.
     *      This is currently not used.
     */
    add: function (coverage /*, testName */) {
        var store = this.store;
        Object.keys(coverage).forEach(function (key) {
            var fileCoverage = coverage[key];
            if (store.hasKey(key)) {
                store.setObject(key, utils.mergeFileCoverage(fileCoverage, store.getObject(key)));
            } else {
                store.setObject(key, fileCoverage);
            }
        });
    },
    /**
     * returns a list of unique file paths for which coverage information has been added.
     * @method files
     * @return {Array} an array of file paths for which coverage information is present.
     */
    files: function () {
        return this.store.keys();
    },
    /**
     * return file coverage information for a single file
     * @method fileCoverageFor
     * @param {String} fileName the path for the file for which coverage information is
     *      required. Must be one of the values returned in the `files()` method.
     * @return {Object} the coverage information for the specified file.
     */
    fileCoverageFor: function (fileName) {
        var ret = this.store.getObject(fileName);
        utils.addDerivedInfoForFile(ret);
        return ret;
    },
    /**
     * returns file coverage information for all files. This has the same format as
     * any of the objects passed in to the `add` method. The number of keys in this
     * object will be a superset of all keys found in the objects passed to `add()`
     * @method getFinalCoverage
     * @return {Object} the merged coverage information
     */
    getFinalCoverage: function () {
        var ret = {},
            that = this;
        this.files().forEach(function (file) {
            ret[file] = that.fileCoverageFor(file);
        });
        return ret;
    },
    /**
     * disposes this collector and reclaims temporary resources used in the
     * computation. Calls `dispose()` on the underlying store.
     * @method dispose
     */
    dispose: function () {
        this.store.dispose();
    }
};

module.exports = Collector;