/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

function extend(cons, proto) {
    Object.keys(proto).forEach(function (k) {
        cons.prototype[k] = proto[k];
    });
}

/**
 * abstract interfaces for writing content
 * @class ContentWriter
 * @module io
 * @main io
 * @constructor
 */
//abstract interface for writing content
function ContentWriter() {
}

ContentWriter.prototype = {
    /**
     * writes the specified string as-is
     * @method write
     * @param {String} str the string to write
     */
    write: /* istanbul ignore next: abstract method */ function (/* str */) {
        throw new Error('write: must be overridden');
    },
    /**
     * writes the specified string with a newline at the end
     * @method println
     * @param {String} str the string to write
     */
    println: function (str) { this.write(str + '\n'); }
};

/**
 * abstract interface for writing files and assets. The caller is expected to
 * call `done` on the writer after it has finished writing all the required
 * files. The writer is an event-emitter that emits a `done` event when `done`
 * is called on it *and* all files have successfully been written.
 *
 * @class Writer
 * @constructor
 */
function Writer() {
    EventEmitter.call(this);
}

util.inherits(Writer, EventEmitter);

extend(Writer, {
    /**
     * allows writing content to a file using a callback that is passed a content writer
     * @method writeFile
     * @param {String} file the name of the file to write
     * @param {Function} callback the callback that is called as `callback(contentWriter)`
     */
    writeFile: /* istanbul ignore next: abstract method */ function (/* file, callback */) {
        throw new Error('writeFile: must be overridden');
    },
    /**
     * copies a file from source to destination
     * @method copyFile
     * @param {String} source the file to copy, found on the file system
     * @param {String} dest the destination path
     */
    copyFile: /* istanbul ignore next: abstract method */ function (/* source, dest */) {
        throw new Error('copyFile: must be overridden');
    },
    /**
     * marker method to indicate that the caller is done with this writer object
     * The writer is expected to emit a `done` event only after this method is called
     * and it is truly done.
     * @method done
     */
    done: /* istanbul ignore next: abstract method */ function () {
        throw new Error('done: must be overridden');
    }
});

module.exports = {
    Writer: Writer,
    ContentWriter: ContentWriter
};

