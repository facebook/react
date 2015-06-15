/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var util = require('util'),
    Store = require('./index');

/**
 * a `Store` implementation using an in-memory object.
 *
 * Usage
 * -----
 *
 *      var store = require('istanbul').Store.create('memory');
 *
 *
 * @class MemoryStore
 * @extends Store
 * @module store
 * @constructor
 */
function MemoryStore() {
    Store.call(this);
    this.map = {};
}

MemoryStore.TYPE = 'memory';
util.inherits(MemoryStore, Store);

Store.mix(MemoryStore, {
    set: function (key, contents) {
        this.map[key] = contents;
    },

    get: function (key) {
        if (!this.hasKey(key)) {
            throw new Error('Unable to find entry for [' + key + ']');
        }
        return this.map[key];
    },

    hasKey: function (key) {
        return this.map.hasOwnProperty(key);
    },

    keys: function () {
        return Object.keys(this.map);
    },

    dispose: function () {
        this.map = {};
    }
});

module.exports = MemoryStore;
