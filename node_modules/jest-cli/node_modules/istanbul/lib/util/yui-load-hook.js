/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

//EXPERIMENTAL code: do not rely on this in anyway until the docs say it is allowed

var path = require('path'),
    yuiRegexp = /yui-nodejs\.js$/;

module.exports = function (matchFn, transformFn, verbose) {
    return function (file) {
        if (!file.match(yuiRegexp)) {
            return;
        }
        var YMain = require(file),
            YUI,
            loaderFn,
            origGet;

        if (YMain.YUI) {
            YUI = YMain.YUI;
            loaderFn = YUI.Env && YUI.Env.mods && YUI.Env.mods['loader-base'] ? YUI.Env.mods['loader-base'].fn : null;
            if (!loaderFn) { return; }
            if (verbose) { console.log('Applying YUI load post-hook'); }
            YUI.Env.mods['loader-base'].fn = function (Y) {
                loaderFn.call(null, Y);
                origGet = Y.Get._exec;
                Y.Get._exec = function (data, url, cb) {
                    if (matchFn(url) || matchFn(path.resolve(url))) { //allow for relative paths as well
                        if (verbose) {
                            console.log('Transforming [' + url + ']');
                        }
                        try {
                            data = transformFn(data, url);
                        } catch (ex) {
                            console.error('Error transforming: ' + url + ' return original code');
                            console.error(ex.message || ex);
                            if (ex.stack) { console.error(ex.stack); }
                        }
                    }
                    return origGet.call(Y, data, url, cb);
                };
                return Y;
            };
        }
    };
};

