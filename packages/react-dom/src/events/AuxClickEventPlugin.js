/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {accumulateTwoPhaseDispatches} from 'events/EventPropagators';

import SyntheticMouseEvent from './SyntheticMouseEvent';

const eventTypes = {
  auxClick: {
    phasedRegistrationNames: {
      bubbled: 'onAuxClick',
      captured: 'onAuxClickCapture',
    },
    dependencies: ['topAuxClick', 'topClick'],
  },
};

const AuxClickEventPlugin = {
  eventTypes,

  extractEvents(
    topLevelType: mixed,
    targetInst: mixed,
    nativeEvent: MouseEvent,
    nativeEventTarget: EventTarget,
  ) {
    if (topLevelType === 'topClick' && nativeEvent.button === 0) {
      return null;
    }

    let event = SyntheticMouseEvent.getPooled(
      eventTypes.auxClick,
      targetInst,
      nativeEvent,
      nativeEventTarget,
    );
    event.type = 'auxclick';

    accumulateTwoPhaseDispatches(event);
    return event;
  },
};

export default AuxClickEventPlugin;
