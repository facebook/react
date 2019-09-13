/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import * as domEvents from './domEvents';
import * as domEventSequences from './domEventSequences';
import {
  buttonsType,
  hasPointerEvent,
  setPointerEvent,
  platform,
} from './domEnvironment';

const createEventTarget = node => ({
  node,
  /**
   * General events abstraction.
   */
  blur(payload) {
    node.dispatchEvent(domEvents.blur(payload));
  },
  click(payload) {
    node.dispatchEvent(domEvents.click(payload));
  },
  contextmenu(payload, options) {
    domEventSequences.contextmenu(node, payload, options);
  },
  focus(payload) {
    node.dispatchEvent(domEvents.focus(payload));
  },
  scroll(payload) {
    node.dispatchEvent(domEvents.scroll(payload));
  },
  /**
   * KeyboardEvent abstraction.
   */
  keydown(payload) {
    node.dispatchEvent(domEvents.keydown(payload));
  },
  keyup(payload) {
    node.dispatchEvent(domEvents.keyup(payload));
  },
  virtualclick(payload) {
    node.dispatchEvent(domEvents.virtualclick(payload));
  },
  tabNext() {
    node.dispatchEvent(
      domEvents.keydown({
        key: 'Tab',
      }),
    );
    node.dispatchEvent(
      domEvents.keyup({
        key: 'Tab',
      }),
    );
  },
  tabPrevious() {
    node.dispatchEvent(
      domEvents.keydown({
        key: 'Tab',
        shiftKey: true,
      }),
    );
    node.dispatchEvent(
      domEvents.keyup({
        key: 'Tab',
        shiftKey: true,
      }),
    );
  },
  /**
   * PointerEvent abstraction.
   * Dispatches the expected sequence of PointerEvents, MouseEvents, and
   * TouchEvents for a given environment.
   */
  // node no longer receives events for the pointer
  pointercancel(payload) {
    domEventSequences.pointercancel(node, payload);
  },
  // node dispatches down events
  pointerdown(payload) {
    domEventSequences.pointerdown(node, payload);
  },
  // node dispatches move events (pointer is not down)
  pointerhover(payload) {
    domEventSequences.pointerhover(node, payload);
  },
  // node dispatches move events (pointer is down)
  pointermove(payload) {
    domEventSequences.pointermove(node, payload);
  },
  // node dispatches enter & over events
  pointerenter(payload) {
    domEventSequences.pointerenter(node, payload);
  },
  // node dispatches exit & leave events
  pointerexit(payload) {
    domEventSequences.pointerexit(node, payload);
  },
  // node dispatches up events
  pointerup(payload) {
    domEventSequences.pointerup(node, payload);
  },
  /**
   * Gesture abstractions.
   * Helpers for event sequences expected in a gesture.
   * target.tap({ pointerType: 'touch' })
   */
  tap(payload) {
    domEventSequences.pointerdown(payload);
    domEventSequences.pointerup(payload);
  },
  /**
   * Utilities
   */
  setBoundingClientRect({x, y, width, height}) {
    node.getBoundingClientRect = function() {
      return {
        width,
        height,
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
      };
    };
  },
});

function describeWithPointerEvent(message, describeFn) {
  const pointerEvent = 'PointerEvent';
  const fallback = 'MouseEvent/TouchEvent';
  describe.each`
    value    | name
    ${true}  | ${pointerEvent}
    ${false} | ${fallback}
  `(`${message}: $name`, entry => {
    const hasPointerEvents = entry.value;
    setPointerEvent(hasPointerEvents);
    describeFn(hasPointerEvents);
  });
}

function testWithPointerType(message, testFn) {
  const table = hasPointerEvent()
    ? ['mouse', 'touch', 'pen']
    : ['mouse', 'touch'];
  test.each(table)(`${message}: %s`, pointerType => {
    testFn(pointerType);
  });
}

export {
  buttonsType,
  createEventTarget,
  describeWithPointerEvent,
  platform,
  hasPointerEvent,
  setPointerEvent,
  testWithPointerType,
};
