/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var invertObject = require('./invertObject');

/*:: type ErrorMap = {  [id: string]: string; }; */

/*:: interface MapBuilderInterface { map: ErrorMap; counter: number }; */

function MapBuilder(
  map/* : ?ErrorMap */,
  counter/* : ?number */
)/* : MapBuilderInterface */ {
  this.map = map || {};
  this.counter = counter || 0;
  return this; // for flow
}

MapBuilder.prototype.reset = function(map/* : ?ErrorMap */, counter/* : ?number */) {
  this.map = map || {};
  this.counter = counter || 0;
};

/**
 * Here we return the error code of the just-added error message.
 * Kinda like what `Array.prototype.push(...)` does.
 */
MapBuilder.prototype.add = function(errorMsg/* : string */)/* : string */ {
  if (this.map.hasOwnProperty(errorMsg)) {
    return this.map[errorMsg];
  }

  this.map[errorMsg] = '' + (this.counter++);
  return '' + (this.counter - 1);
};

/**
 * Inverts the map object and returns an error map like
 * { 0: 'MUCH ERROR', 1: 'SUCH WRONG' }
 */
MapBuilder.prototype.generate = function()/* : ErrorMap */ {
  return invertObject(this.map);
};

module.exports = MapBuilder;
