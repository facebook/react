/*
Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
*/

/*jslint nomen: true */
var path = require('path'),
    Store = require('./lib/store'),
    Report = require('./lib/report'),
    meta = require('./lib/util/meta');

//register our standard plugins
require('./lib/register-plugins');

/**
 * the top-level API for `istanbul`. provides access to the key libraries in
 * istanbul so you can write your own tools using `istanbul` as a library.
 *
 * Usage
 * -----
 *
 *      var istanbul = require('istanbul');
 *
 *
 * @class Istanbul
 * @static
 * @module main
 * @main main
 */

module.exports = {
    /**
     * the Instrumenter class.
     * @property Instrumenter
     * @type Instrumenter
     * @static
     */
    Instrumenter: require('./lib/instrumenter'),
    /**
     * the Store class.
     * @property  Store
     * @type Store
     * @static
     */
    Store: Store,
    /**
     * the Collector class
     * @property  Collector
     * @type Collector
     * @static
     */
    Collector: require('./lib/collector'),
    /**
     * the hook module
     * @property hook
     * @type Hook
     * @static
     */
    hook: require('./lib/hook'),
    /**
     * the Report class
     * @property Report
     * @type Report
     * @static
     */
    Report: Report,
    /**
     * the config module
     * @property config
     * @type Config
     * @static
     */
    config: require('./lib/config'),
    /**
     * the Reporter class
     * @property Reporter
     * @type Reporter
     * @static
     */
    Reporter: require('./lib/reporter'),
    /**
     * utility for processing coverage objects
     * @property utils
     * @type ObjectUtils
     * @static
     */
    utils: require('./lib/object-utils'),
    /**
     * asynchronously returns a function that can match filesystem paths.
     * The function returned in the callback may be passed directly as a `matcher`
     * to the functions in the `hook` module.
     *
     * When no options are passed, the match function is one that matches all JS
     * files under the current working directory except ones under `node_modules`
     *
     * Match patterns are `ant`-style patterns processed using the `fileset` library.
     * Examples not provided due to limitations in putting asterisks inside
     * jsdoc comments. Please refer to tests under `test/other/test-matcher.js`
     * for examples.
     *
     * @method matcherFor
     * @static
     * @param {Object} options Optional. Lookup options.
     * @param {String} [options.root] the root of the filesystem tree under
     *     which to match files. Defaults to `process.cwd()`
     * @param {Array} [options.includes] an array of include patterns to match.
     *     Defaults to all JS files under the root.
     * @param {Array} [options.excludes] and array of exclude patterns. File paths
     *     matching these patterns will be excluded by the returned matcher.
     *     Defaults to files under `node_modules` found anywhere under root.
     * @param {Function(err, matchFunction)} callback  The callback that is
     *      called with two arguments. The first is an `Error` object in case
     *      of errors or a falsy value if there were no errors. The second
     *      is a function that may be use as a matcher.
     */
    matcherFor: require('./lib/util/file-matcher').matcherFor,
    /**
     * the version of the library
     * @property VERSION
     * @type String
     * @static
     */
    VERSION: meta.VERSION,
    /**
     * the abstract Writer class
     * @property Writer
     * @type Writer
     * @static
     */
    Writer: require('./lib/util/writer').Writer,
    /**
     * the abstract ContentWriter class
     * @property ContentWriter
     * @type ContentWriter
     * @static
     */
    ContentWriter: require('./lib/util/writer').ContentWriter,
    /**
     * the concrete FileWriter class
     * @property FileWriter
     * @type FileWriter
     * @static
     */
    FileWriter: require('./lib/util/file-writer'),
    //undocumented
    _yuiLoadHook: require('./lib/util/yui-load-hook'),
    //undocumented
    TreeSummarizer: require('./lib/util/tree-summarizer'),
    //undocumented
    assetsDir: path.resolve(__dirname, 'lib', 'vendor')
};


