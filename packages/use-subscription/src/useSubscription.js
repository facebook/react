/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useSyncExternalStore} from 'use-sync-external-store/shim';

// Hook used for safely managing subscriptions in concurrent mode.
//
// In order to avoid removing and re-adding subscriptions each time this hook is called,
// the parameters passed to this hook should be memoized in some way–
// either by wrapping the entire params object with useMemo()
// or by wrapping the individual callbacks with useCallback().
/**
 * A hook that subscribes to a value and returns the current value of the subscription.
 * @param {Object} options - An object containing the getCurrentValue and subscribe functions.
 * @param {Function} options.getCurrentValue - A function that synchronously returns the current value of the subscription.
 * @param {Function} options.subscribe - A function that is passed an event handler to attach to the subscription. It should return an unsubscribe function that removes the handler.
 * @returns {*} - The current value of the subscription.
 */
export function useSubscription({
  // (Synchronously) returns the current value of our subscription.
  getCurrentValue,

  // This function is passed an event handler to attach to the subscription.
  // It should return an unsubscribe function that removes the handler.
  subscribe,
}) {
  return useSyncExternalStore(subscribe, getCurrentValue);
}
