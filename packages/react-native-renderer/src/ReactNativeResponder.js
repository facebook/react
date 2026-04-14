/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * Responder System:
 * -----------------
 *
 * - A global, solitary "interaction lock" on a view.
 * - If a node becomes the responder, it should convey visual feedback
 *   immediately to indicate so, either by highlighting or moving accordingly.
 * - To be the responder means that touches are exclusively important to that
 *   responder view, and no other view.
 * - While touches are still occurring, the responder lock can be transferred to
 *   a new view, but only to increasingly "higher" views (meaning ancestors of
 *   the current responder).
 *
 * Responder being granted:
 * ------------------------
 *
 * - Touch starts, moves, and scrolls can cause a view to become the responder.
 * - We dispatch `startShouldSetResponder`/`moveShouldSetResponder` as bubbling
 *   EventTarget events to the "appropriate place".
 * - If nothing is currently the responder, the "appropriate place" is the
 *   initiating event's target.
 * - If something *is* already the responder, the "appropriate place" is the
 *   first common ancestor of the event target and the current responder.
 * - Some negotiation happens: See the timing diagram below.
 * - Scrolled views automatically become responder. The reasoning is that a
 *   platform scroll view that isn't built on top of the responder system has
 *   begun scrolling, and the active responder must now be notified that the
 *   interaction is no longer locked to it — the system has taken over.
 *
 * Responder being released:
 * -------------------------
 *
 * As soon as no more touches that *started* inside of descendants of the
 * *current* responder remain active, an `onResponderRelease` event is
 * dispatched to the current responder, and the responder lock is released.
 *
 * Direct dispatch (no EventTarget):
 * ----------------------------------
 *
 * Responder events bypass EventTarget entirely. Handlers are read directly
 * from `canonical.currentProps` at dispatch time — no commit-time registration,
 * no wrappers, no addEventListener.
 *
 * Negotiation walks the fiber tree manually (capture then bubble phase) using
 * `getParent()`. The first handler returning `true` wins.
 *
 * Lifecycle events call the handler directly and inspect return values:
 * - `onResponderGrant` returning `true` → block native responder
 * - `onResponderTerminationRequest` returning `false` → refuse termination
 *
 *
 *                                              Negotiation Performed
 *                                              +-----------------------+
 *                                             /                         \
 * Process low level events to    +     Current Responder      +   wantsResponder
 * determine who to perform negot-|   (if any exists at all)   |
 * iation/transition              | Otherwise just pass through|
 * -------------------------------+----------------------------+------------------+
 * Bubble to find first ID        |                            |
 * to return true:wantsResponder  |                            |
 *                                |                            |
 *      +-------------+           |                            |
 *      | onTouchStart|           |                            |
 *      +------+------+     none  |                            |
 *             |            return|                            |
 * +-----------v-------------+true| +------------------------+ |
 * |onStartShouldSetResponder|----->|onResponderStart (cur)  |<-----------+
 * +-----------+-------------+    | +------------------------+ |          |
 *             |                  |                            | +--------+-------+
 *             | returned true for|       false:REJECT +-------->|onResponderReject
 *             | wantsResponder   |                    |       | +----------------+
 *             | (now attempt     | +------------------+-----+ |
 *             |  handoff)        | |   onResponder          | |
 *             +------------------->|      TerminationRequest| |
 *                                | +------------------+-----+ |
 *                                |                    |       | +----------------+
 *                                |         true:GRANT +-------->|onResponderGrant|
 *                                |                            | +--------+-------+
 *                                | +------------------------+ |          |
 *                                | |   onResponderTerminate |<-----------+
 *                                | +------------------+-----+ |
 *                                |                    |       | +----------------+
 *                                |                    +-------->|onResponderStart|
 *                                |                            | +----------------+
 * Bubble to find first ID        |                            |
 * to return true:wantsResponder  |                            |
 *                                |                            |
 *      +-------------+           |                            |
 *      | onTouchMove |           |                            |
 *      +------+------+     none  |                            |
 *             |            return|                            |
 * +-----------v-------------+true| +------------------------+ |
 * |onMoveShouldSetResponder |----->|onResponderMove (cur)   |<-----------+
 * +-----------+-------------+    | +------------------------+ |          |
 *             |                  |                            | +--------+-------+
 *             | returned true for|       false:REJECT +-------->|onResponderReject
 *             | wantsResponder   |                    |       | +----------------+
 *             | (now attempt     | +------------------+-----+ |
 *             |  handoff)        | |   onResponder          | |
 *             +------------------->|      TerminationRequest| |
 *                                | +------------------+-----+ |
 *                                |                    |       | +----------------+
 *                                |         true:GRANT +-------->|onResponderGrant|
 *                                |                            | +--------+-------+
 *                                | +------------------------+ |          |
 *                                | |   onResponderTerminate |<-----------+
 *                                | +------------------+-----+ |
 *                                |                    |       | +----------------+
 *                                |                    +-------->|onResponderMove |
 *                                |                            | +----------------+
 *                                |                            |
 *                                |                            |
 *       Some active touch started|                            |
 *       inside current responder | +------------------------+ |
 *       +------------------------->|      onResponderEnd    | |
 *       |                        | +------------------------+ |
 *   +---+---------+              |                            |
 *   | onTouchEnd  |              |                            |
 *   +---+---------+              |                            |
 *       |                        | +------------------------+ |
 *       +------------------------->|     onResponderEnd     | |
 *       No active touches started| +-----------+------------+ |
 *       inside current responder |             |              |
 *                                |             v              |
 *                                | +------------------------+ |
 *                                | |    onResponderRelease  | |
 *                                | +------------------------+ |
 *                                |                            |
 *                                +                            +
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

import {LegacySyntheticEvent} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';
import ResponderTouchHistoryStore from './legacy-events/ResponderTouchHistoryStore';
import {HostComponent} from 'react-reconciler/src/ReactWorkTags';
import {getInstanceFromNode} from './ReactFabricComponentTree';

// The currently active responder (tracked as a fiber)
let responderFiber: Fiber | null = null;

/**
 * Count of current touches. A textInput should become responder iff the
 * selection changes while there is a touch on the screen.
 */
let trackedTouchCount = 0;

function isStartish(topLevelType: string): boolean {
  return topLevelType === 'topTouchStart';
}

function isMoveish(topLevelType: string): boolean {
  return topLevelType === 'topTouchMove';
}

function isEndish(topLevelType: string): boolean {
  return topLevelType === 'topTouchEnd' || topLevelType === 'topTouchCancel';
}

/**
 * Walk up the fiber tree, skipping non-HostComponent fibers.
 */
function getParent(inst: Fiber): Fiber | null {
  let fiber = inst.return;
  while (fiber != null) {
    if (fiber.tag === HostComponent) {
      return fiber;
    }
    fiber = fiber.return;
  }
  return null;
}

/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */
function getLowestCommonAncestor(instA: Fiber, instB: Fiber): Fiber | null {
  let depthA = 0;
  for (let tempA: Fiber | null = instA; tempA; tempA = getParent(tempA)) {
    depthA++;
  }
  let depthB = 0;
  for (let tempB: Fiber | null = instB; tempB; tempB = getParent(tempB)) {
    depthB++;
  }

  let a = instA;
  let b = instB;

  // If A is deeper, crawl up.
  while (depthA - depthB > 0) {
    a = (getParent(a): any);
    depthA--;
  }

  // If B is deeper, crawl up.
  while (depthB - depthA > 0) {
    b = (getParent(b): any);
    depthB--;
  }

  // Walk in lockstep until we find a match.
  let depth = depthA;
  while (depth--) {
    if (a === b || a === b.alternate) {
      return a;
    }
    a = (getParent(a): any);
    b = (getParent(b): any);
  }
  return null;
}

/**
 * Return true if A is an ancestor of B.
 */
function isAncestor(instA: Fiber, instB: Fiber | null): boolean {
  let current = instB;
  while (current != null) {
    if (instA === current || instA === current.alternate) {
      return true;
    }
    current = getParent(current);
  }
  return false;
}

function changeResponder(
  nextResponderFiber: Fiber | null,
  blockNativeResponder: boolean,
): void {
  const oldResponderFiber = responderFiber;
  responderFiber = nextResponderFiber;

  // Notify the native side about responder changes so native gestures
  // (e.g. ScrollView scroll) can defer to JS.
  if (oldResponderFiber != null && oldResponderFiber.stateNode != null) {
    nativeFabricUIManager.setIsJSResponder(
      oldResponderFiber.stateNode.node,
      false,
      blockNativeResponder,
    );
  }
  if (nextResponderFiber != null && nextResponderFiber.stateNode != null) {
    nativeFabricUIManager.setIsJSResponder(
      nextResponderFiber.stateNode.node,
      true,
      blockNativeResponder,
    );
  }
}

/**
 * Determine the negotiation event name for a given topLevelType.
 */
function getShouldSetEventName(topLevelType: string): string {
  if (isStartish(topLevelType)) {
    return 'startShouldSetResponder';
  } else if (isMoveish(topLevelType)) {
    return 'moveShouldSetResponder';
  } else if (topLevelType === 'topSelectionChange') {
    return 'selectionChangeShouldSetResponder';
  } else {
    return 'scrollShouldSetResponder';
  }
}

/**
 * Run negotiation by walking the fiber tree directly. Performs capture phase
 * (root→target) then bubble phase (target→root), calling handlers from
 * `canonical.currentProps`. The first handler that returns `true` wins.
 *
 * The dispatch target is determined as follows:
 * - If no responder exists, dispatch from the event target (full tree).
 * - If a responder exists, dispatch from the lowest common ancestor (LCA)
 *   of the responder and the target — only ancestors can claim.
 * - If the LCA is the current responder itself, skip it (don't re-negotiate
 *   with yourself) and dispatch from the parent.
 *
 * @return {Fiber | null} The fiber that claimed the responder, or null.
 */
function negotiateResponder(
  targetFiber: Fiber,
  topLevelType: string,
  nativeEvent: {[string]: mixed},
): Fiber | null {
  const shouldSetEventName = getShouldSetEventName(topLevelType);

  // Determine the negotiation dispatch target
  let negotiationFiber;
  let skipSelf = false;
  if (responderFiber == null) {
    negotiationFiber = targetFiber;
  } else {
    negotiationFiber = getLowestCommonAncestor(responderFiber, targetFiber);
    if (negotiationFiber == null) {
      return null;
    }
    if (negotiationFiber === responderFiber) {
      skipSelf = true;
    }
  }

  const dispatchFiber = skipSelf
    ? getParent(negotiationFiber)
    : negotiationFiber;
  if (dispatchFiber == null) {
    return null;
  }

  // Build ancestor path (root to dispatch fiber)
  const path: Array<Fiber> = [];
  let fiber: Fiber | null = dispatchFiber;
  while (fiber != null) {
    path.unshift(fiber);
    fiber = getParent(fiber);
  }

  const event = new LegacySyntheticEvent(
    shouldSetEventName,
    {bubbles: true, cancelable: true},
    nativeEvent,
  );
  // $FlowFixMe[prop-missing] touchHistory is a responder-specific extension not in the Event type
  event.touchHistory = ResponderTouchHistoryStore.touchHistory;

  // Derive prop names from event name
  const bubblePropName =
    'on' +
    shouldSetEventName.charAt(0).toUpperCase() +
    shouldSetEventName.slice(1);
  const capturePropName = bubblePropName + 'Capture';

  // Capture phase: root → target
  for (let i = 0; i < path.length; i++) {
    const stateNode = path[i].stateNode;
    if (stateNode == null) {
      continue;
    }
    const handler = stateNode.canonical.currentProps[capturePropName];
    if (typeof handler === 'function' && handler(event) === true) {
      return path[i];
    }
  }

  // Bubble phase: target → root
  for (let i = path.length - 1; i >= 0; i--) {
    const stateNode = path[i].stateNode;
    if (stateNode == null) {
      continue;
    }
    const handler = stateNode.canonical.currentProps[bubblePropName];
    if (typeof handler === 'function' && handler(event) === true) {
      return path[i];
    }
  }

  return null;
}

/**
 * Dispatch a lifecycle responder event by calling the handler directly from
 * `canonical.currentProps`. Returns the handler's return value so callers can
 * inspect it (e.g. `onResponderGrant` returning `true` to block native).
 */
function dispatchResponderEvent(
  fiber: Fiber,
  eventName: string,
  nativeEvent: {[string]: mixed},
): mixed {
  const stateNode = fiber.stateNode;
  if (stateNode == null) {
    return undefined;
  }

  const propName =
    'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
  const handler = stateNode.canonical.currentProps[propName];
  if (typeof handler !== 'function') {
    return undefined;
  }

  const event = new LegacySyntheticEvent(
    eventName,
    {bubbles: false, cancelable: true},
    nativeEvent,
  );
  // $FlowFixMe[prop-missing] touchHistory is a responder-specific extension not in the Event type
  event.touchHistory = ResponderTouchHistoryStore.touchHistory;

  return handler(event);
}

/**
 * A transfer is a negotiation between a currently set responder and the next
 * element to claim responder status. Any start event could trigger a transfer
 * of responderFiber. Any move event could trigger a transfer.
 *
 * @return {boolean} True if a transfer of responder could possibly occur.
 */
function canTriggerTransfer(
  topLevelType: string,
  targetFiber: Fiber | null,
  nativeEvent: {[string]: mixed},
): boolean {
  return (
    targetFiber != null &&
    ((topLevelType === 'topScroll' && !nativeEvent.responderIgnoreScroll) ||
      (trackedTouchCount > 0 && topLevelType === 'topSelectionChange') ||
      isStartish(topLevelType) ||
      isMoveish(topLevelType))
  );
}

/**
 * Returns whether or not this touch end event makes it such that there are no
 * longer any touches that started inside of the current `responderFiber`.
 *
 * @param {NativeEvent} nativeEvent Native touch end event.
 * @return {boolean} Whether or not this touch end event ends the responder.
 */
function noResponderTouches(nativeEvent: {[string]: mixed}): boolean {
  const touches = (nativeEvent.touches: any);
  if (!touches || touches.length === 0) {
    return true;
  }
  for (let i = 0; i < touches.length; i++) {
    const activeTouch = touches[i];
    const target = activeTouch.target;
    if (target !== null && target !== undefined && target !== 0) {
      // Is the original touch location inside of the current responder?
      const targetInst = getInstanceFromNode(target);
      if (
        responderFiber != null &&
        targetInst != null &&
        isAncestor(responderFiber, targetInst)
      ) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Process a native event through the responder system.
 * Called from ReactFabricEventEmitter when the flag is enabled.
 */
export function processResponderEvent(
  topLevelType: string,
  targetFiber: Fiber | null,
  nativeEvent: {[string]: mixed},
): void {
  // Track touch count
  if (isStartish(topLevelType)) {
    trackedTouchCount += 1;
  } else if (isEndish(topLevelType)) {
    if (trackedTouchCount >= 0) {
      trackedTouchCount -= 1;
    } else {
      if (__DEV__) {
        console.warn(
          'Ended a touch event which was not counted in `trackedTouchCount`.',
        );
      }
      return;
    }
  }

  ResponderTouchHistoryStore.recordTouchTrack(topLevelType, (nativeEvent: any));

  // Negotiation: determine if a new responder should be set
  if (
    canTriggerTransfer(topLevelType, targetFiber, nativeEvent) &&
    targetFiber != null
  ) {
    const wantsResponderFiber = negotiateResponder(
      targetFiber,
      topLevelType,
      nativeEvent,
    );

    if (wantsResponderFiber != null && wantsResponderFiber !== responderFiber) {
      // A new view wants to become responder.
      // onResponderGrant returning true means block native responder.
      const grantResult = dispatchResponderEvent(
        wantsResponderFiber,
        'responderGrant',
        nativeEvent,
      );
      const blockNativeResponder = grantResult === true;

      if (responderFiber != null) {
        // Capture in a local to preserve Flow narrowing across function calls.
        const currentResponder = responderFiber;
        // Ask current responder if it will terminate.
        // onResponderTerminationRequest returning false means refuse.
        const terminationResult = dispatchResponderEvent(
          currentResponder,
          'responderTerminationRequest',
          nativeEvent,
        );
        const shouldSwitch = terminationResult !== false;

        if (shouldSwitch) {
          dispatchResponderEvent(
            currentResponder,
            'responderTerminate',
            nativeEvent,
          );
          changeResponder(wantsResponderFiber, blockNativeResponder);
        } else {
          dispatchResponderEvent(
            wantsResponderFiber,
            'responderReject',
            nativeEvent,
          );
        }
      } else {
        changeResponder(wantsResponderFiber, blockNativeResponder);
      }
    }
  }

  // Responder may or may not have transferred on a new touch start/move.
  // Regardless, whoever is the responder after any potential transfer, we
  // direct all touch start/move/ends to them in the form of
  // `onResponderMove/Start/End`. These will be called for *every* additional
  // finger that move/start/end, dispatched directly to whoever is the
  // current responder at that moment, until the responder is "released".
  //
  // These multiple individual change touch events are always bookended
  // by `onResponderGrant`, and one of
  // (`onResponderRelease/onResponderTerminate`).
  if (responderFiber != null) {
    // Capture in a local to preserve Flow narrowing across function calls.
    const activeResponder = responderFiber;
    if (isStartish(topLevelType)) {
      dispatchResponderEvent(activeResponder, 'responderStart', nativeEvent);
    } else if (isMoveish(topLevelType)) {
      dispatchResponderEvent(activeResponder, 'responderMove', nativeEvent);
    } else if (isEndish(topLevelType)) {
      dispatchResponderEvent(activeResponder, 'responderEnd', nativeEvent);

      if (topLevelType === 'topTouchCancel') {
        dispatchResponderEvent(
          activeResponder,
          'responderTerminate',
          nativeEvent,
        );
        changeResponder(null, false);
      } else if (noResponderTouches(nativeEvent)) {
        dispatchResponderEvent(
          activeResponder,
          'responderRelease',
          nativeEvent,
        );
        changeResponder(null, false);
      }
    }
  }
}
