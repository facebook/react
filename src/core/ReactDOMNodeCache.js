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
 */

"use strict";

var ReactMount = require('ReactMount');

var nodeCache = {};

/**
 * DOM node cache only intended for use by React. Placed into a shared module so
 * that both read and write utilities may benefit from a shared cache.
 */
var ReactDOMNodeCache = {
  /**
   * Releases fast id lookups (node/style cache). This implementation is
   * aggressive with purging because the bookkeeping associated with doing fine
   * grained deleted from the cache may outweight the benefits of the cache. The
   * heuristic that should be used to purge is 'any time anything is deleted'.
   * Typically this means that a large amount of content is being replaced and
   * several elements would need purging regardless. It's also a time when an
   * application is likely not in the middle of a "smooth operation" (such as
   * animating/scrolling).
   */
  purgeEntireCache: function() {
    nodeCache = {};
    return nodeCache;
  },
  getCachedNodeByID: function(id) {
    return nodeCache[id] ||
      (nodeCache[id] =
        document.getElementById(id) ||
        ReactMount.findReactRenderedDOMNodeSlow(id));
  }
};

module.exports = ReactDOMNodeCache;
