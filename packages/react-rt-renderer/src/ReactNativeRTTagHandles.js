/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

var invariant = require('fbjs/lib/invariant');

/**
 * Keeps track of allocating and associating native "tags" which are numeric,
 * unique view IDs. All the native tags are negative numbers, to avoid
 * collisions, but in the JS we keep track of them as positive integers to store
 * them effectively in Arrays. So we must refer to them as "inverses" of the
 * native tags (that are * normally negative).
 *
 * It *must* be the case that every `rootNodeID` always maps to the exact same
 * `tag` forever. The easiest way to accomplish this is to never delete
 * anything from this table.
 * Why: Because `dangerouslyReplaceNodeWithMarkupByID` relies on being able to
 * unmount a component with a `rootNodeID`, then mount a new one in its place,
 */
var INITIAL_TAG_COUNT = 1;
var ReactNativeRTTagHandles = {
  tagsStartAt: INITIAL_TAG_COUNT,
  tagCount: INITIAL_TAG_COUNT,

  allocateTag: function(): number {
    // Skip over root IDs as those are reserved for native
    var tag = ReactNativeRTTagHandles.tagCount;
    ReactNativeRTTagHandles.tagCount++;
    return tag;
  },

  assertRootTag: function(tag: number): void {
    invariant(
      ReactNativeRTTagHandles.reactTagIsNativeID(tag),
      'Expect a native root tag, instead got %s',
      tag,
    );
  },

  reactTagIsNativeID: function(reactTag: number): boolean {
    // We reserve all tags that are 1 mod 10 for native view creation
    return reactTag % 10 === 1;
  },
};

module.exports = ReactNativeRTTagHandles;
