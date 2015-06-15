/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var util = require('util'),
    fs = require('fs'),
    Store = require('./index');

/**
 * a `Store` implementation that doesn't actually store anything. It assumes that keys
 * are absolute file paths, and contents are contents of those files.
 * Thus, `set` for this store is no-op, `get` returns the
 * contents of the filename that the key represents, `hasKey` returns true if the key
 * supplied is a valid file path and `keys` always returns an empty array.
 *
 * Usage
 * -----
 *
 *      var store = require('istanbul').Store.create('fslookup');
 *
 *
 * @class LookupStore
 * @extends Store
 * @module store
 * @constructor
 */
function LookupStore(opts) {
    Store.call(this, opts);
}

LookupStore.TYPE = 'fslookup';
util.inherits(LookupStore, Store);

Store.mix(LookupStore, {
    keys: function () {
        return [];
    },
    get: function (key) {
        return fs.readFileSync(key, 'utf8');
    },
    hasKey: function (key) {
        var stats;
        try {
            stats = fs.statSync(key);
            return stats.isFile();
        } catch (ex) {
            return false;
        }
    },
    set: function (key /*, contents */) {
        if (!this.hasKey(key)) {
            throw new Error('Attempt to set contents for non-existent file [' + key + '] on a fslookup store');
        }
        return key;
    }
});


module.exports = LookupStore;

