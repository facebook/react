/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Used by act() to track whether you're outside an act() scope.
 * We use a renderer's flushPassiveEffects as the sigil value
 * so we can track identity of the renderer.
 */

const ReactActingRendererSigil = {
  current: (null: null | (() => boolean)),
};
export default ReactActingRendererSigil;
