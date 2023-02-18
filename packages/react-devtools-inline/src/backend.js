/** @flow */

import Agent from 'react-devtools-shared/src/backend/agent';
import Bridge from 'react-devtools-shared/src/bridge';
import {initBackend} from 'react-devtools-shared/src/backend';
import {installHook} from 'react-devtools-shared/src/hook';
import setupNativeStyleEditor from 'react-devtools-shared/src/backend/NativeStyleEditor/setupNativeStyleEditor';

import type {BackendBridge} from 'react-devtools-shared/src/bridge';
import type {Wall} from 'react-devtools-shared/src/types';

function startActivation(contentWindow: any, bridge: BackendBridge) {
  const onSavedPreferences = (data: $FlowFixMe) => {
    // This is the only message we're listening for,
    // so it's safe to cleanup after we've received it.
    bridge.removeListener('savedPreferences', onSavedPreferences);

    const {
      appendComponentStack,
      breakOnConsoleErrors,
      componentFilters,
      showInlineWarningsAndErrors,
      hideConsoleLogsInStrictMode,
    } = data;

    contentWindow.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ =
      appendComponentStack;
    contentWindow.__REACT_DEVTOOLS_BREAK_ON_CONSOLE_ERRORS__ =
      breakOnConsoleErrors;
    contentWindow.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = componentFilters;
    contentWindow.__REACT_DEVTOOLS_SHOW_INLINE_WARNINGS_AND_ERRORS__ =
      showInlineWarningsAndErrors;
    contentWindow.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ =
      hideConsoleLogsInStrictMode;

    // TRICKY
    // The backend entry point may be required in the context of an iframe or the parent window.
    // If it's required within the parent window, store the saved values on it as well,
    // since the injected renderer interface will read from window.
    // Technically we don't need to store them on the contentWindow in this case,
    // but it doesn't really hurt anything to store them there too.
    if (contentWindow !== window) {
      window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = appendComponentStack;
      window.__REACT_DEVTOOLS_BREAK_ON_CONSOLE_ERRORS__ = breakOnConsoleErrors;
      window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = componentFilters;
      window.__REACT_DEVTOOLS_SHOW_INLINE_WARNINGS_AND_ERRORS__ =
        showInlineWarningsAndErrors;
      window.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ =
        hideConsoleLogsInStrictMode;
    }

    finishActivation(contentWindow, bridge);
  };

  bridge.addListener('savedPreferences', onSavedPreferences);

  // The backend may be unable to read saved preferences directly,
  // because they are stored in localStorage within the context of the extension (on the frontend).
  // Instead it relies on the extension to pass preferences through.
  // Because we might be in a sandboxed iframe, we have to ask for them by way of postMessage().
  bridge.send('getSavedPreferences');
}

function finishActivation(contentWindow: any, bridge: BackendBridge) {
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

export function activate(
  contentWindow: any,
  {
    bridge,
  }: {
    bridge?: BackendBridge,
  } = {},
): void {
  if (bridge == null) {
    bridge = createBridge(contentWindow);
  }

  startActivation(contentWindow, bridge);
}

export function createBridge(contentWindow: any, wall?: Wall): BackendBridge {
  const {parent} = contentWindow;

  if (wall == null) {
    wall = {
      listen(fn) {
        const onMessage = ({data}: $FlowFixMe) => {
          fn(data);
        };
        contentWindow.addEventListener('message', onMessage);
        return () => {
          contentWindow.removeEventListener('message', onMessage);
        };
      },
      send(event: string, payload: any, transferable?: Array<any>) {
        parent.postMessage({event, payload}, '*', transferable);
      },
    };
  }

  return (new Bridge(wall): BackendBridge);
}

export function initialize(contentWindow: any): void {
  installHook(contentWindow);
}
