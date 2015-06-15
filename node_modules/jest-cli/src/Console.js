/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

/*jshint strict:false*/

var util = require('util');

function Console(messageQueue) {
  if (!(this instanceof Console)) {
    return new Console(messageQueue);
  }

  Object.defineProperty(this, '_messageQueue', {
    value: messageQueue,
    writable: true,
    enumerable: false,
    configurable: true
  });

  Object.defineProperty(this, '_times', {
    value: {},
    writable: true,
    enumerable: false,
    configurable: true
  });

  // bind the prototype functions to this Console instance
  var keys = Object.keys(Console.prototype);
  for (var v = 0; v < keys.length; v++) {
    var k = keys[v];
    this[k] = this[k].bind(this);
  }
}

Console.prototype.log = function() {
  this._messageQueue.push({
    type: 'log',
    data: util.format.apply(this, arguments) + '\n'
  });
};


Console.prototype.info = Console.prototype.log;


Console.prototype.warn = function() {
  this._messageQueue.push({
    type: 'warn',
    data: util.format.apply(this, arguments) + '\n'
  });
};


Console.prototype.error = function() {
  this._messageQueue.push({
    type: 'error',
    data: util.format.apply(this, arguments) + '\n'
  });
};


Console.prototype.dir = function(object, options) {
  this._messageQueue.push({
    type: 'dir',
    data: util.inspect(object, util._extend({
            customInspect: false
          }, options)) + '\n'
  });
};


Console.prototype.time = function(label) {
  this._times[label] = Date.now();
};


Console.prototype.timeEnd = function(label) {
  var time = this._times[label];
  if (!time) {
    throw new Error('No such label: ' + label);
  }
  var duration = Date.now() - time;
  this.log('%s: %dms', label, duration);
};


Console.prototype.trace = function() {
  // TODO probably can to do this better with V8's debug object once that is
  // exposed.
  var err = new Error();
  err.name = 'Trace';
  err.message = util.format.apply(this, arguments);
  /*jshint noarg:false*/
  Error.captureStackTrace(err, arguments.callee);
  this.error(err.stack);
};


Console.prototype.assert = function(expression) {
  if (!expression) {
    var arr = Array.prototype.slice.call(arguments, 1);
    require('assert').ok(false, util.format.apply(this, arr));
  }
};

module.exports = Console;
