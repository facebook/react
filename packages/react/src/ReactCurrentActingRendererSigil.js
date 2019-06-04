/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * We maintain a 'stack' of renderer specific sigils
 * corresponding to act() calls, so we can track whenever an update
 * happens inside/outside of one.
 */

const ReactCurrentActingRendererSigil = {
  current: ([]: Array<{}>),
};
export default ReactCurrentActingRendererSigil;
