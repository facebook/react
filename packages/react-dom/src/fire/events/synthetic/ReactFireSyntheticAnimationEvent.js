/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extendSyntheticEvent, SyntheticEvent} from './ReactFireSyntheticEvent';

/**
 * @interface Event
 * @see http://www.w3.org/TR/css3-animations/#AnimationEvent-interface
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AnimationEvent
 */
export const SyntheticAnimationEvent = extendSyntheticEvent(SyntheticEvent, {
  animationName: null,
  elapsedTime: null,
  pseudoElement: null,
});
