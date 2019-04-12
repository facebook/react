/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Used by act() to track whether you're outside an act() scope.
 * This is an object so we can track identity of the renderer.
 */

const ReactShouldWarnActingUpdates = {
  current: (null: null | {}), // {} should probably be an opaque type
};
export default ReactShouldWarnActingUpdates;
