/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SyntheticMouseEvent from './SyntheticMouseEvent';
import {enablePluginEventSystem} from 'shared/ReactFeatureFlags';

let SyntheticDragEvent;

if (enablePluginEventSystem) {
  /**
   * @interface DragEvent
   * @see http://www.w3.org/TR/DOM-Level-3-Events/
   */
  SyntheticDragEvent = SyntheticMouseEvent.extend({
    dataTransfer: null,
  });
}

export default SyntheticDragEvent;
