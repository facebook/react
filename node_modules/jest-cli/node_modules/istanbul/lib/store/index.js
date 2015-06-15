/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var Factory = require('../util/factory'),
    factory = new Factory('store', __dirname, false);
/**
 * An abstraction for keeping track of content against some keys (e.g.
 * original source, instrumented source, coverage objects against file names).
 * This class is both the base class as well as a factory for `Store` implementations.
 *
 * Usage
 * -----
 *
 *      var Store = require('istanbul').Store,
 *          store = Store.create('memory');
 *
 *      //basic use
 *      store.set('foo', 'foo-content');
 *      var content = store.get('foo');
 *
 *      //keys and values
 *      store.keys().forEach(function (key) {
 *          console.log(key + ':\n' + store.get(key);
 *      });
 *      if (store.hasKey('bar') { console.log(store.get('bar'); }
 *
 *
 *      //syntactic sugar
 *      store.setObject('foo', { foo: true });
 *      console.log(store.getObject('foo').foo);
 *
 *      store.dispose();
 *
 * @class Store
 * @constructor
 * @module store
 * @param {Object} options Optional. The options supported by a specific store implementation.
 * @main store
 */
function Store(/* options */) {}

//add register, create, mix, loadAll, getStoreList as class methods
factory.bindClassMethods(Store);

/**
 * registers a new store implementation.
 * @method register
 * @static
 * @param {Function} constructor the constructor function for the store. This function must have a
 *  `TYPE` property of type String, that will be used in `Store.create()`
 */
/**
 * returns a store implementation of the specified type.
 * @method create
 * @static
 * @param {String} type the type of store to create
 * @param {Object} opts Optional. Options specific to the store implementation
 * @return {Store} a new store of the specified type
 */

Store.prototype = {
    /**
     * sets some content associated with a specific key. The manner in which
     * duplicate keys are handled for multiple `set()` calls with the same
     * key is implementation-specific.
     *
     * @method set
     * @param {String} key the key for the content
     * @param {String} contents the contents for the key
     */
    set: function (/* key, contents */) { throw new Error("set: must be overridden"); },
    /**
     * returns the content associated to a specific key or throws if the key
     * was not `set`
     * @method get
     * @param {String} key the key for which to get the content
     * @return {String} the content for the specified key
     */
    get: function (/* key */) { throw new Error("get: must be overridden"); },
    /**
     * returns a list of all known keys
     * @method keys
     * @return {Array} an array of seen keys
     */
    keys: function () { throw new Error("keys: must be overridden"); },
    /**
     * returns true if the key is one for which a `get()` call would work.
     * @method hasKey
     * @param {String} key
     * @return true if the key is valid for this store, false otherwise
     */
    hasKey: function (/* key */) { throw new Error("hasKey: must be overridden"); },
    /**
     * lifecycle method to dispose temporary resources associated with the store
     * @method dispose
     */
    dispose: function () {},
    /**
     * sugar method to return an object associated with a specific key. Throws
     * if the content set against the key was not a valid JSON string.
     * @method getObject
     * @param {String} key the key for which to return the associated object
     * @return {Object} the object corresponding to the key
     */
    getObject: function (key) {
        return JSON.parse(this.get(key));
    },
    /**
     * sugar method to set an object against a specific key.
     * @method setObject
     * @param {String} key the key for the object
     * @param {Object} object the object to be stored
     */
    setObject: function (key, object) {
        return this.set(key, JSON.stringify(object));
    }
};

module.exports = Store;


