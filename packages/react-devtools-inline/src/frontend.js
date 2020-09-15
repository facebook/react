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
} from 'react-devtools-shared/src/utils';
import {
  MESSAGE_TYPE_GET_SAVED_PREFERENCES,
  MESSAGE_TYPE_SAVED_PREFERENCES,
} from './constants';

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {Props} from 'react-devtools-shared/src/devtools/views/DevTools';

export function initialize(
  contentWindow: window,
): React.AbstractComponent<Props, mixed> {
  const onGetSavedPreferencesMessage = ({data, source}) => {
    if (source === 'react-devtools-content-script') {
      // Ignore messages from the DevTools browser extension.
    }

    switch (data.type) {
      case MESSAGE_TYPE_GET_SAVED_PREFERENCES:
        // This is the only message we're listening for,
        // so it's safe to cleanup after we've received it.
        window.removeEventListener('message', onGetSavedPreferencesMessage);

        // The renderer interface can't read saved preferences directly,
        // because they are stored in localStorage within the context of the extension.
        // Instead it relies on the extension to pass them through.
        contentWindow.postMessage(
          {
            type: MESSAGE_TYPE_SAVED_PREFERENCES,
            appendComponentStack: getAppendComponentStack(),
            breakOnConsoleErrors: getBreakOnConsoleErrors(),
            componentFilters: getSavedComponentFilters(),
          },
          '*',
        );
        break;
      default:
        break;
    }
  };

  window.addEventListener('message', onGetSavedPreferencesMessage);

  const bridge: FrontendBridge = new Bridge({
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
  });

  const store: Store = new Store(bridge, {supportsTraceUpdates: true});

  const ForwardRef = forwardRef<Props, mixed>((props, ref) => (
    <DevTools ref={ref} bridge={bridge} store={store} {...props} />
  ));
  ForwardRef.displayName = 'DevTools';

  return ForwardRef;
}
