/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import monkeyPatchDispatchEvent from '../monkeyPatchDispatchEvent';
import {getEventPriority} from '../ReactDOMEventListener';
import {
  DiscreteEventPriority,
  DefaultEventPriority,
} from 'react-reconciler/src/ReactEventPriorities';

// TODO: Use this in ReactDOMHostConfig
function getCurrentEventPriority(): * {
  if (window.eventPriorityOverride) {
    return window.eventPriorityOverride;
  }
  const currentEvent = window.event;
  if (currentEvent === undefined) {
    return DefaultEventPriority;
  }
  return getEventPriority(currentEvent.type);
}

describe('monkeyPatchDispatchEvent', () => {
  const originalDispatchEvent = window.EventTarget.prototype.dispatchEvent;

  beforeEach(() => {
    monkeyPatchDispatchEvent();
  });

  afterEach(() => {
    window.EventTarget.prototype.dispatchEvent = originalDispatchEvent;
  });

  it('patches dispatchEvent and makes custom events inherit the priority of the outer event type', done => {
    const outerButton = document.createElement('button');
    const innerButton = document.createElement('button');
    const event = new Event('click');
    innerButton.addEventListener('customEvent', () => {
      expect(getCurrentEventPriority()).toEqual(DiscreteEventPriority);
      done();
    });
    outerButton.addEventListener('click', () => {
      innerButton.dispatchEvent(new Event('customEvent'));
      expect(window.event?.type).toEqual('click');
    });
    outerButton.click();
  });

  it('patches dispatchEvent and makes nested custom events inherit the priority of the outer event type', done => {
    const outerButton = document.createElement('button');
    const innerButton = document.createElement('button');
    const innerButton2 = document.createElement('button');
    const event = new Event('click');
    innerButton.addEventListener('customEvent', () => {
      innerButton2.dispatchEvent(new Event('customEvent'));
    });
    innerButton2.addEventListener('customEvent', () => {
      expect(getCurrentEventPriority()).toEqual(DiscreteEventPriority);
      done();
    });
    outerButton.addEventListener('click', () => {
      innerButton.dispatchEvent(new Event('customEvent'));
      expect(window.event?.type).toEqual('click');
    });
    outerButton.click();
  });

  it('patches dispatchEvent and does not change priority of an inner click event', done => {
    const outerButton = document.createElement('button');
    const innerButton = document.createElement('button');
    const event = new Event('click');
    innerButton.addEventListener('click', () => {
      expect(getCurrentEventPriority()).toEqual(DiscreteEventPriority);
      done();
    });
    outerButton.addEventListener('customEvent', () => {
      innerButton.dispatchEvent(new Event('click'));
      expect(getCurrentEventPriority()).toEqual(DefaultEventPriority);
    });
    outerButton.dispatchEvent(new Event('customEvent'));
  });
});
