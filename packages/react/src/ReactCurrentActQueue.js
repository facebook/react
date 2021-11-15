/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type RendererTask = boolean => RendererTask | null;

const ReactCurrentActQueue = {
  current: (null: null | Array<RendererTask>),

  // Used to reproduce behavior of `batchedUpdates` in legacy mode.
  isBatchingLegacy: false,
  didScheduleLegacyUpdate: false,
};

export default ReactCurrentActQueue;
