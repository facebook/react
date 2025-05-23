/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function defaultOnDefaultTransitionIndicator(): void | (() => void) {
  if (typeof navigation !== 'object') {
    // If the Navigation API is not available, then this is a noop.
    return;
  }

  let isCancelled = false;
  let pendingResolve: null | (() => void) = null;

  function handleNavigate(event: NavigateEvent) {
    if (event.canIntercept && event.info === 'react-transition') {
      event.intercept({
        handler() {
          return new Promise(resolve => (pendingResolve = resolve));
        },
        focusReset: 'manual',
        scroll: 'manual',
      });
    }
  }

  function handleNavigateComplete() {
    if (pendingResolve !== null) {
      // If this was not our navigation completing, we were probably cancelled.
      // We'll start a new one below.
      pendingResolve();
      pendingResolve = null;
    }
    if (!isCancelled) {
      // Some other navigation completed but we should still be running.
      // Start another fake one to keep the loading indicator going.
      startFakeNavigation();
    }
  }

  // $FlowFixMe
  navigation.addEventListener('navigate', handleNavigate);
  // $FlowFixMe
  navigation.addEventListener('navigatesuccess', handleNavigateComplete);
  // $FlowFixMe
  navigation.addEventListener('navigateerror', handleNavigateComplete);

  function startFakeNavigation() {
    if (isCancelled) {
      // We already stopped this Transition.
      return;
    }
    if (navigation.transition) {
      // There is an on-going Navigation already happening. Let's wait for it to
      // finish before starting our fake one.
      return;
    }
    // Trigger a fake navigation to the same page
    const currentEntry = navigation.currentEntry;
    if (currentEntry && currentEntry.url != null) {
      navigation.navigate(currentEntry.url, {
        state: currentEntry.getState(),
        info: 'react-transition', // indicator to routers to ignore this navigation
        history: 'replace',
      });
    }
  }

  // Delay the start a bit in case this is a fast navigation.
  setTimeout(startFakeNavigation, 100);

  return function () {
    isCancelled = true;
    // $FlowFixMe
    navigation.removeEventListener('navigate', handleNavigate);
    // $FlowFixMe
    navigation.removeEventListener('navigatesuccess', handleNavigateComplete);
    // $FlowFixMe
    navigation.removeEventListener('navigateerror', handleNavigateComplete);
    if (pendingResolve !== null) {
      pendingResolve();
      pendingResolve = null;
    }
  };
}
