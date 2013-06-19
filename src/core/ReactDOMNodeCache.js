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
 * @providesModule ReactDOMNodeCache
 * @typechecks
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');
var ReactMount = require('ReactMount');

var invariant = require('invariant');

var nodeCache = {};

/**
 * DOM node cache only intended for use by React. Placed into a shared module so
 * that both read and write utilities may benefit from a shared cache.
 *
 * @internal
 */
var ReactDOMNodeCache = {

  /**
   * Finds the node with the supplied React-generated DOM ID.
   *
   * @param {string} id A React-generated DOM ID.
   * @return {?DOMElement} DOM node with the suppled `id`.
   * @internal
   */
  getNodeByID: function(id) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'getDOMNode(): The DOM is not supported in the current environment.'
    );
    if (!nodeCache[id]) {
      nodeCache[id] =
        document.getElementById(id) ||
        ReactMount.findReactRenderedDOMNodeSlow(id);
    }
    return nodeCache[id];
  },

  /**
   * Purges the supplied ID from cache.
   *
   * @param {string} id A React-generated DOM ID.
   * @internal
   */
  purgeID: function(id) {
    nodeCache[id] = null;
  },

  /**
   * Purges the entire node cache used for fast ID lookups.
   *
   * This implementation is aggressive with purging because the bookkeeping
   * associated with doing fine-grained deletes from the cache may outweight the
   * benefits of the cache.
   *
   * The heuristic used to purge is 'any time anything is deleted'. Typically
   * this means that a large amount of content is being replaced and several
   * elements would need purging regardless. This is also when applications are
   * less likely to be in the middle of "smooth operations" such as animations
   * or scrolling.
   *
   * @internal
   */
  purgeEntireCache: function() {
    nodeCache = {};
  }

};

module.exports = ReactDOMNodeCache;
