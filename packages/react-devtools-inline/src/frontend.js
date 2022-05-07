/** @flow */

import * as React from 'react';
import {forwardRef} from 'react';
import Bridge from 'react-devtools-shared/src/bridge';
import Store from 'react-devtools-shared/src/devtools/store';
import DevTools from 'react-devtools-shared/src/devtools/views/DevTools';
import {
  getAppendComponentStack,
  getBreakOnConsoleErrors,
  getSavedComponentFilters,
  getShowInlineWarningsAndErrors,
  getHideConsoleLogsInStrictMode,
} from 'react-devtools-shared/src/utils';

import type {Wall} from 'react-devtools-shared/src/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {Props} from 'react-devtools-shared/src/devtools/views/DevTools';

type Config = {|
  checkBridgeProtocolCompatibility?: boolean,
  supportsNativeInspection?: boolean,
  supportsProfiling?: boolean,
|};

export function createStore(bridge: FrontendBridge, config?: Config): Store {
  return new Store(bridge, {
    checkBridgeProtocolCompatibility: true,
    supportsTraceUpdates: true,
    supportsTimeline: true,
    supportsNativeInspection: true,
    ...config,
  });
}

export function createBridge(
  contentWindow: window,
  wall?: Wall,
): FrontendBridge {
  if (wall == null) {
    wall = {
      listen(fn) {
        const onMessage = ({data}) => {
          fn(data);
        };
        window.addEventListener('message', onMessage);
        return () => {
          window.removeEventListener('message', onMessage);
        };
      },
      send(event: string, payload: any, transferable?: Array<any>) {
        contentWindow.postMessage({event, payload}, '*', transferable);
      },
    };
  }

  return (new Bridge(wall): FrontendBridge);
}

export function initialize(
  contentWindow: window,
  {
    bridge,
    store,
  }: {|
    bridge?: FrontendBridge,
    store?: Store,
  |} = {},
): React.AbstractComponent<Props, mixed> {
  if (bridge == null) {
    bridge = createBridge(contentWindow);
  }

  // Type refinement.
  const frontendBridge = ((bridge: any): FrontendBridge);

  if (store == null) {
    store = createStore(frontendBridge);
  }

  const onGetSavedPreferences = () => {
    // This is the only message we're listening for,
    // so it's safe to cleanup after we've received it.
    frontendBridge.removeListener('getSavedPreferences', onGetSavedPreferences);

    const data = {
      appendComponentStack: getAppendComponentStack(),
      breakOnConsoleErrors: getBreakOnConsoleErrors(),
      componentFilters: getSavedComponentFilters(),
      showInlineWarningsAndErrors: getShowInlineWarningsAndErrors(),
      hideConsoleLogsInStrictMode: getHideConsoleLogsInStrictMode(),
    };

    // The renderer interface can't read saved preferences directly,
    // because they are stored in localStorage within the context of the extension.
    // Instead it relies on the extension to pass them through.
    frontendBridge.send('savedPreferences', data);
  };

  frontendBridge.addListener('getSavedPreferences', onGetSavedPreferences);

  const ForwardRef = forwardRef<Props, mixed>((props, ref) => (
    <DevTools ref={ref} bridge={frontendBridge} store={store} {...props} />
  ));
  ForwardRef.displayName = 'DevTools';

  return ForwardRef;
}
