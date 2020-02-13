/** @flow */

import Agent from 'react-devtools-shared/src/backend/agent';
import Bridge from 'react-devtools-shared/src/bridge';
import {initBackend} from 'react-devtools-shared/src/backend';
import {installHook} from 'react-devtools-shared/src/hook';
import setupNativeStyleEditor from 'react-devtools-shared/src/backend/NativeStyleEditor/setupNativeStyleEditor';
import {
  MESSAGE_TYPE_GET_SAVED_PREFERENCES,
  MESSAGE_TYPE_SAVED_PREFERENCES,
} from './constants';

function startActivation(contentWindow: window) {
  const {parent} = contentWindow;

  const onMessage = ({data}) => {
    switch (data.type) {
      case MESSAGE_TYPE_SAVED_PREFERENCES:
        // This is the only message we're listening for,
        // so it's safe to cleanup after we've received it.
        contentWindow.removeEventListener('message', onMessage);

        const {appendComponentStack, componentFilters} = data;

        contentWindow.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = appendComponentStack;
        contentWindow.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = componentFilters;

        // TRICKY
        // The backend entry point may be required in the context of an iframe or the parent window.
        // If it's required within the parent window, store the saved values on it as well,
        // since the injected renderer interface will read from window.
        // Technically we don't need to store them on the contentWindow in this case,
        // but it doesn't really hurt anything to store them there too.
        if (contentWindow !== window) {
          window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = appendComponentStack;
          window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = componentFilters;
        }

        finishActivation(contentWindow);
        break;
      default:
        break;
    }
  };

  contentWindow.addEventListener('message', onMessage);

  // The backend may be unable to read saved preferences directly,
  // because they are stored in localStorage within the context of the extension (on the frontend).
  // Instead it relies on the extension to pass preferences through.
  // Because we might be in a sandboxed iframe, we have to ask for them by way of postMessage().
  parent.postMessage({type: MESSAGE_TYPE_GET_SAVED_PREFERENCES}, '*');
}

function finishActivation(contentWindow: window) {
  const {parent} = contentWindow;

  const bridge = new Bridge({
    listen(fn) {
      const onMessage = event => {
        fn(event.data);
      };
      contentWindow.addEventListener('message', onMessage);
      return () => {
        contentWindow.removeEventListener('message', onMessage);
      };
    },
    send(event: string, payload: any, transferable?: Array<any>) {
      parent.postMessage({event, payload}, '*', transferable);
    },
  });

  const agent = new Agent(bridge);

  const hook = contentWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook) {
    initBackend(hook, agent, contentWindow);

    // Setup React Native style editor if a renderer like react-native-web has injected it.
    if (hook.resolveRNStyle) {
      setupNativeStyleEditor(
        bridge,
        agent,
        hook.resolveRNStyle,
        hook.nativeStyleEditorValidAttributes,
      );
    }
  }
}

export function activate(contentWindow: window): void {
  startActivation(contentWindow);
}

export function initialize(contentWindow: window): void {
  installHook(contentWindow);
}
