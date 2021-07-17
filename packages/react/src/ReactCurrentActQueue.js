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
  // Our internal tests use a custom implementation of `act` that works by
  // mocking the Scheduler package. Use this field to disable the `act` warning.
  // TODO: Maybe the warning should be disabled by default, and then turned
  // on at the testing frameworks layer? Instead of what we do now, which
  // is check if a `jest` global is defined.
  disableActWarning: (false: boolean),

  // Used to reproduce behavior of `batchedUpdates` in legacy mode.
  isBatchingLegacy: false,
  didScheduleLegacyUpdate: false,
};

export default ReactCurrentActQueue;
