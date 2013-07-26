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
 * @providesModule mapAllChildren
 */

"use strict";

var PooledClass = require('PooledClass');

var invariant = require('invariant');
var traverseAllChildren = require('traverseAllChildren');

var threeArgumentPooler = PooledClass.threeArgumentPooler;

/**
 * PooledClass representing the bookkeeping associated with performing a child
 * mapping. Allows avoiding binding callbacks.
 *
 * @constructor MapBookKeeping
 * @param {!*} mapResult Object containing the ordered map of results.
 * @param {!function} mapFunction Function to perform mapping with.
 * @param {?*} mapContext Context to perform mapping with.
 */
function MapBookKeeping(mapResult, mapFunction, mapContext) {
  this.mapResult = mapResult;
  this.mapFunction = mapFunction;
  this.mapContext = mapContext;
}
PooledClass.addPoolingTo(MapBookKeeping, threeArgumentPooler);

module.exports = MapBookKeeping;


function mapSingleChildIntoContext(traverseContext, child, name, i) {
  var mapBookKeeping = traverseContext;
  var mapResult = mapBookKeeping.mapResult;
  var mapFunction = mapBookKeeping.mapFunction;
  var mapContext = mapBookKeeping.mapContext;
  var mappedChild = mapFunction.call(mapContext, child, name, i);
  // We found a component instance.
  invariant(
    !mapResult.hasOwnProperty(name),
    'mapAllChildren(...): Encountered two children with the same key, `%s`. ' +
    'Children keys must be unique.',
    name
  );
  mapResult[name] = mappedChild;
}

/**
 * Maps children that are typically specified as `props.children`.
 *
 * The provided mapFunction(child, key, index) will be called for each
 * leaf child.
 *
 * TODO: This may likely break any calls to `mapAllChildren` that were
 * previously relying on the fact that we guarded against null children.
 *
 * @param {array} children
 * @param {function(*, string, int)} mapFunction.
 * @param {*} mapContext Context for mapFunction.
 * @return {array} mirrored array with mapped children.
 */
function mapAllChildren(children, mapFunction, mapContext) {
  if (children == null) {
    return children;
  }

  var mapResult = {};
  var traverseContext =
    MapBookKeeping.getPooled(mapResult, mapFunction, mapContext);
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  MapBookKeeping.release(traverseContext);
  return mapResult;
}

module.exports = mapAllChildren;
