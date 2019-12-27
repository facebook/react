/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Used by act() to track whether you're inside an act() scope.
 */

const IsSomeRendererActing = {
  current: (false: boolean),
};
export default IsSomeRendererActing;
