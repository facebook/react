import {useEffect, useReducer, useState} from 'react';

export function useSubscription({
  // This is the thing being subscribed to (e.g. an observable, event dispatcher, etc).
  source,

  // (Synchronously) returns the current value of our subscription source.
  getCurrentValue,

  // This function is passed an event handler to attach to the subscription source.
  // It should return an unsubscribe function that removes the handler.
  subscribe,
}) {
  // Read the current value from our subscription source.
  // When this value changes, we'll schedule an update with React.
  // It's important to also store the source itself so that we can check for staleness.
  // (See the comment in checkForUpdates() below for more info.)
  const [state, setState] = useState({
    source,
    value: getCurrentValue(source),
  });

  // If the source has changed since our last render, schedule an update with its current value.
  if (state.source !== source) {
    setState({
      source,
      value: getCurrentValue(source),
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
      const checkForUpdates = () => {
        setState(state => {
          // Ignore values from stale sources!
          // Since we subscribe an unsubscribe in a passive effect,
          // it's possible that this callback will be invoked for a stale (previous) source.
          // This check avoids scheduling an update for htat stale source.
          if (state.source !== source) {
            return state;
          }

          // Some subscription sources will auto-invoke the handler, even if the value hasn't changed.
          // If the value hasn't changed, no update is needed.
          // Return state as-is so React can bail out and avoid an unnecessary render.
          const value = getCurrentValue(source);
          if (state.value === value) {
            return state;
          }

          return { ...state, value };
        });
      };
      const unsubscribe = subscribe(source, checkForUpdates);

      // Because we're subscribing in a passive effect,
      // it's possible that an update has occurred between render and our effect handler.
      // Check for this and schedule an update if work has occurred.
      checkForUpdates();

      return () => unsubscribe();
    },
    [getCurrentValue, source, subscribe],
  );

  // Return the current value for our caller to use while rendering.
  return state.value;
}
