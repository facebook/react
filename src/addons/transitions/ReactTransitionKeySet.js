/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @typechecks static-only
 * @providesModule ReactTransitionKeySet
 */

"use strict";

var ReactChildren = require('ReactChildren');

var MERGE_KEY_SETS_TAIL_SENTINEL = {};

var ReactTransitionKeySet = {
  /**
   * Given `this.props.children`, return an object mapping key to child. Just
   * simple syntactic sugar around ReactChildren.map().
   *
   * @param {*} children `this.props.children`
   * @return {object} Mapping of key to child
   */
  getChildMapping: function(children) {
    return ReactChildren.map(children, function(child) {
      return child;
    });
  },

  /**
   * Simple syntactic sugar to get an object with keys of all of `children`.
   * Does not have references to the children themselves.
   *
   * @param {*} children `this.props.children`
   * @return {object} Mapping of key to the value "true"
   */
  getKeySet: function(children) {
    return ReactChildren.map(children, function() {
      return true;
    });
  },

  /**
   * When you're adding or removing children some may be added or removed in the
   * same render pass. We want ot show *both* since we want to simultaneously
   * animate elements in and out. This function takes a previous set of keys
   * and a new set of keys and merges them with its best guess of the correct
   * ordering. In the future we may expose some of the utilities in
   * ReactMultiChild to make this easy, but for now React itself does not
   * directly have this concept of the union of prevChildren and nextChildren
   * so we implement it here.
   *
   * @param {object} prev prev child keys as returned from
   * `ReactTransitionKeySet.getKeySet()`.
   * @param {object} next next child keys as returned from
   * `ReactTransitionKeySet.getKeySet()`.
   * @return {object} a key set that contains all keys in `prev` and all keys
   * in `next` in a reasonable order.
   */
  mergeKeySets: function(prev, next) {
    prev = prev || {};
    next = next || {};

    var keySet = {};
    var prevKeys = Object.keys(prev).concat([MERGE_KEY_SETS_TAIL_SENTINEL]);
    var nextKeys = Object.keys(next).concat([MERGE_KEY_SETS_TAIL_SENTINEL]);
    var i;
    for (i = 0; i < prevKeys.length - 1; i++) {
      var prevKey = prevKeys[i];
      if (next[prevKey]) {
        continue;
      }

      // This key is not in the new set. Place it in our
      // best guess where it should go. We do this by searching
      // for a key after the current one in prevKeys that is
      // still in nextKeys, and inserting right before it.
      // I know this is O(n^2), but this is not a particularly
      // hot code path.
      var insertPos = -1;

      for (var j = i + 1; j < prevKeys.length; j++) {
        insertPos = nextKeys.indexOf(prevKeys[j]);
        if (insertPos >= 0) {
          break;
        }
      }

      // Insert before insertPos
      nextKeys.splice(insertPos, 0, prevKey);
    }

    for (i = 0; i < nextKeys.length - 1; i++) {
      keySet[nextKeys[i]] = true;
    }

    return keySet;
  }
};

module.exports = ReactTransitionKeySet;
