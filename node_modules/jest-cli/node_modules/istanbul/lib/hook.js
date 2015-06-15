/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/**
 * provides a mechanism to transform code in the scope of `require` or `vm.createScript`.
 * This mechanism is general and relies on a user-supplied `matcher` function that determines when transformations should be
 * performed and a user-supplied `transformer` function that performs the actual transform.
 * Instrumenting code for coverage is one specific example of useful hooking.
 *
 * Note that both the `matcher` and `transformer` must execute synchronously.
 *
 * For the common case of matching filesystem paths based on inclusion/ exclusion patterns, use the `matcherFor`
 * function in the istanbul API to get a matcher.
 *
 * It is up to the transformer to perform processing with side-effects, such as caching, storing the original
 * source code to disk in case of dynamically generated scripts etc. The `Store` class can help you with this.
 *
 * Usage
 * -----
 *
 *      var hook = require('istanbul').hook,
 *          myMatcher = function (file) { return file.match(/foo/); },
 *          myTransformer = function (code, file) { return 'console.log("' + file + '");' + code; };
 *
 *      hook.hookRequire(myMatcher, myTransformer);
 *
 *      var foo = require('foo'); //will now print foo's module path to console
 *
 * @class Hook
 * @module main
 */
var path = require('path'),
    fs = require('fs'),
    Module = require('module'),
    vm = require('vm'),
    originalLoaders = {},
    originalCreateScript = vm.createScript,
    originalRunInThisContext = vm.runInThisContext;

function transformFn(matcher, transformer, verbose) {

    return function (code, filename) {
        var shouldHook = typeof filename === 'string' && matcher(path.resolve(filename)),
            transformed,
            changed = false;

        if (shouldHook) {
            if (verbose) {
                console.error('Module load hook: transform [' + filename + ']');
            }
            try {
                transformed = transformer(code, filename);
                changed = true;
            } catch (ex) {
                console.error('Transformation error; return original code');
                console.error(ex);
                transformed = code;
            }
        } else {
            transformed = code;
        }
        return { code: transformed, changed: changed };
    };
}

function unloadRequireCache(matcher) {
    if (matcher && typeof require !== 'undefined' && require && require.cache) {
        Object.keys(require.cache).forEach(function (filename) {
            if (matcher(filename)) {
                delete require.cache[filename];
            }
        });
    }
}
/**
 * hooks `require` to return transformed code to the node module loader.
 * Exceptions in the transform result in the original code being used instead.
 * @method hookRequire
 * @static
 * @param matcher {Function(filePath)} a function that is called with the absolute path to the file being
 *  `require`-d. Should return a truthy value when transformations need to be applied to the code, a falsy value otherwise
 * @param transformer {Function(code, filePath)} a function called with the original code and the associated path of the file
 *  from where the code was loaded. Should return the transformed code.
 * @param options {Object} options Optional.
 * @param {Boolean} [options.verbose] write a line to standard error every time the transformer is called
 * @param {Function} [options.postLoadHook] a function that is called with the name of the file being
 *  required. This is called after the require is processed irrespective of whether it was transformed.
 */
function hookRequire(matcher, transformer, options) {
    options = options || {};
    var extensions,
        fn = transformFn(matcher, transformer, options.verbose),
        postLoadHook = options.postLoadHook &&
            typeof options.postLoadHook === 'function' ? options.postLoadHook : null;

    extensions = options.extensions || ['.js'];

    extensions.forEach(function(ext){
        if (!(ext in originalLoaders)) { 
            originalLoaders[ext] = Module._extensions[ext];
        } 
        Module._extensions[ext] = function (module, filename) {
            var ret = fn(fs.readFileSync(filename, 'utf8'), filename);
            if (ret.changed) {
                module._compile(ret.code, filename);
            } else {
                originalLoaders[ext](module, filename);
            }
            if (postLoadHook) {
                postLoadHook(filename);
            }
        };
    });
}
/**
 * unhook `require` to restore it to its original state.
 * @method unhookRequire
 * @static
 */
function unhookRequire() {
    Object.keys(originalLoaders).forEach(function(ext) {
        Module._extensions[ext] = originalLoaders[ext];
    });
}
/**
 * hooks `vm.createScript` to return transformed code out of which a `Script` object will be created.
 * Exceptions in the transform result in the original code being used instead.
 * @method hookCreateScript
 * @static
 * @param matcher {Function(filePath)} a function that is called with the filename passed to `vm.createScript`
 *  Should return a truthy value when transformations need to be applied to the code, a falsy value otherwise
 * @param transformer {Function(code, filePath)} a function called with the original code and the filename passed to
 *  `vm.createScript`. Should return the transformed code.
 * @param options {Object} options Optional.
 * @param {Boolean} [options.verbose] write a line to standard error every time the transformer is called
 */
function hookCreateScript(matcher, transformer, opts) {
    opts = opts || {};
    var fn = transformFn(matcher, transformer, opts.verbose);
    vm.createScript = function (code, file) {
        var ret = fn(code, file);
        return originalCreateScript(ret.code, file);
    };
}

/**
 * unhooks vm.createScript, restoring it to its original state.
 * @method unhookCreateScript
 * @static
 */
function unhookCreateScript() {
    vm.createScript = originalCreateScript;
}


/**
 * hooks `vm.runInThisContext` to return transformed code.
 * @method hookRunInThisContext
 * @static
 * @param matcher {Function(filePath)} a function that is called with the filename passed to `vm.createScript`
 *  Should return a truthy value when transformations need to be applied to the code, a falsy value otherwise
 * @param transformer {Function(code, filePath)} a function called with the original code and the filename passed to
 *  `vm.createScript`. Should return the transformed code.
 * @param options {Object} options Optional.
 * @param {Boolean} [options.verbose] write a line to standard error every time the transformer is called
 */
function hookRunInThisContext(matcher, transformer, opts) {
    opts = opts || {};
    var fn = transformFn(matcher, transformer, opts.verbose);
    vm.runInThisContext = function (code, file) {
        var ret = fn(code, file);
        return originalRunInThisContext(ret.code, file);
    };
}

/**
 * unhooks vm.runInThisContext, restoring it to its original state.
 * @method unhookRunInThisContext
 * @static
 */
function unhookRunInThisContext() {
    vm.runInThisContext = originalRunInThisContext;
}


module.exports = {
    hookRequire: hookRequire,
    unhookRequire: unhookRequire,
    hookCreateScript: hookCreateScript,
    unhookCreateScript: unhookCreateScript,
    hookRunInThisContext : hookRunInThisContext,
    unhookRunInThisContext : unhookRunInThisContext,
    unloadRequireCache: unloadRequireCache
};


