/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var util = require('util'),
    path = require('path'),
    fs = require('fs'),
    abbrev = require('abbrev');

function Factory(kind, dir, allowAbbreviations) {
    this.kind = kind;
    this.dir = dir;
    this.allowAbbreviations = allowAbbreviations;
    this.classMap = {};
    this.abbreviations = null;
}

Factory.prototype = {

    knownTypes: function () {
        var keys = Object.keys(this.classMap);
        keys.sort();
        return keys;
    },

    resolve: function (abbreviatedType) {
        if (!this.abbreviations) {
            this.abbreviations = abbrev(this.knownTypes());
        }
        return this.abbreviations[abbreviatedType];
    },

    register: function (constructor) {
        var type = constructor.TYPE;
        if (!type) { throw new Error('Could not register ' + this.kind + ' constructor [no TYPE property]: ' + util.inspect(constructor)); }
        this.classMap[type] = constructor;
        this.abbreviations = null;
    },

    create: function (type, opts) {
        var allowAbbrev = this.allowAbbreviations,
            realType = allowAbbrev ? this.resolve(type) : type,
            Cons;

        Cons = realType ? this.classMap[realType] : null;
        if (!Cons) { throw new Error('Invalid ' + this.kind + ' [' + type + '], allowed values are ' + this.knownTypes().join(', ')); }
        return new Cons(opts);
    },

    loadStandard: function (dir) {
        var that = this;
        fs.readdirSync(dir).forEach(function (file) {
            if (file !== 'index.js' && file.indexOf('.js') === file.length - 3) {
                try {
                    that.register(require(path.resolve(dir, file)));
                } catch (ex) {
                    console.error(ex.message);
                    console.error(ex.stack);
                    throw new Error('Could not register ' + that.kind + ' from file ' + file);
                }
            }
        });
    },

    bindClassMethods: function (Cons) {
        var tmpKind = this.kind.charAt(0).toUpperCase() + this.kind.substring(1), //ucfirst
            allowAbbrev = this.allowAbbreviations;

        Cons.mix = Factory.mix;
        Cons.register = this.register.bind(this);
        Cons.create = this.create.bind(this);
        Cons.loadAll = this.loadStandard.bind(this, this.dir);
        Cons['get' + tmpKind + 'List'] = this.knownTypes.bind(this);
        if (allowAbbrev) {
            Cons['resolve' + tmpKind + 'Name'] = this.resolve.bind(this);
        }
    }
};

Factory.mix = function (cons, proto) {
    Object.keys(proto).forEach(function (key) {
        cons.prototype[key] = proto[key];
    });
};

module.exports = Factory;

