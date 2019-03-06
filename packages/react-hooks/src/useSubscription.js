/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useEffect, useMemo, useState} from 'react';

// Hook used for safely managing subscriptions in concurrent mode.
// It requires two parameters: a factory function and a dependencies array.
export function useSubscription<T>(
  // This function is called whenever the specified dependencies change.
  // It should return an object with two keys (functions) documented below.
  nextCreate: () => {|
    // Get the current subscription value.
    getCurrentValue: () => T,

    // This function is passed a callback to be called any time the subscription changes.
    // It should return an unsubscribe function.
    subscribe: (() => void) => () => void,
  |},
  // Dependencies array.
  // Any time one of the inputs change, a new subscription will be setup,
  // and the previous listener will be unsubscribed.
  deps: Array<mixed>,
) {
  const current = useMemo(nextCreate, deps);

  // Read the current subscription value.
  // When this value changes, we'll schedule an update with React.
  // It's important to also store the current inputs as well so we can check for staleness.
  // (See the comment in checkForUpdates() below for more info.)
  const [state, setState] = useState({
    current,
    value: current.getCurrentValue(),
  });

  // If the inputs have changed since our last render, schedule an update with the current value.
  // We could do this in our effect handler below but there's no need to wait in this case.
  if (state.current !== current) {
    setState({
      current,
      value: current.getCurrentValue(),
    });
  }

  // It is important not to subscribe while rendering because this can lead to memory leaks.
  // (Learn more at reactjs.org/docs/strict-mode.html#detecting-unexpected-side-effects)
  // Instead, we wait until the commit phase to attach our handler.
  //
  // We intentionally use a passive effect (useEffect) rather than a synchronous one (useLayoutEffect)
  // so that we don't stretch the commit phase.
  // This also has an added benefit when multiple components are subscribed to the same source:
  // It allows each of the event handlers to safely schedule work without potentially removing an another handler.
  // (Learn more at https://codesandbox.io/s/k0yvr5970o)
  useEffect(
    () => {
      let didUnsubscribe = false;

      const checkForUpdates = () => {
        // It's possible that this callback will be invoked even after being unsubscribed,
        // if it's removed as a result of an event/update from the source.
        // In this case, React will log a DEV warning about an update from an unmounted component.
        // We can avoid triggering that warning with this check.
        if (didUnsubscribe) {
          return;
        }

        setState(prevState => {
          // Ignore values from stale subscriptions!
          // Since we subscribe an unsubscribe in a passive effect,
          // it's possible that this callback will be invoked for a stale (previous) subscription.
          // This check avoids scheduling an update for the stale subscription.
          if (prevState.current !== current) {
            return prevState;
          }

          // Some subscriptions will auto-invoke the handler when it's attached.
          // If the value hasn't changed, no update is needed.
          // Return state as-is so React can bail out and avoid an unnecessary render.
          const value = current.getCurrentValue();
          if (prevState.value === value) {
            return prevState;
          }

          return {...prevState, value};
        });
      };

      const unsubscribe = current.subscribe(checkForUpdates);

      // Because we're subscribing in a passive effect,
      // it's possible that an update has occurred between render and our effect handler.
      // Check for this and schedule an update if work has occurred.
      checkForUpdates();

      return () => {
        didUnsubscribe = true;
        unsubscribe();
      };
    },
    [current],
  );

  // Return the current value for our caller to use while rendering.
  return state.value;
}
