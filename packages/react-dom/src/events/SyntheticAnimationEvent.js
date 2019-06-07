/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SyntheticEvent from 'events/SyntheticEvent';
import {enablePluginEventSystem} from 'shared/ReactFeatureFlags';

let SyntheticAnimationEvent;

if (enablePluginEventSystem) {
  /**
   * @interface Event
   * @see http://www.w3.org/TR/css3-animations/#AnimationEvent-interface
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AnimationEvent
   */
  SyntheticAnimationEvent = SyntheticEvent.extend({
    animationName: null,
    elapsedTime: null,
    pseudoElement: null,
  });
}

export default SyntheticAnimationEvent;
