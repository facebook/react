/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativePropRegistry
 * @flow
 */
'use strict';

var objects = {};
var uniqueID = 1;
var emptyObject = {};

class ReactNativePropRegistry {
  static register(object: Object): number {
    var id = ++uniqueID;
    if (__DEV__) {
      Object.freeze(object);
    }
    objects[id] = object;
    return id;
  }

  static getByID(id: number): Object {
    if (!id) {
      // Used in the style={[condition && id]} pattern,
      // we want it to be a no-op when the value is false or null
      return emptyObject;
    }

    var object = objects[id];
    if (!object) {
      if (id > 1 && id <= uniqueID) {
        // We cannot directly test for unregistered objects because keeping a permanent registry of them
        // would leak memory, however we do know that ids above 1 and below uniqueID were once registered
        console.warn(
          'Style with id `' + id + '` has been unregistered. Skipping ...',
        );
      } else {
        console.warn('Invalid style with id `' + id + '`. Skipping ...');
      }
      return emptyObject;
    }
    return object;
  }

  static unregister(id: number): void {
    // delete is used instead of setting to null so we don't slowly leak memory by keeping keys
    delete objects[id];
  }
}

module.exports = ReactNativePropRegistry;
