/* global chrome */

import type {SourceSelection} from 'react-devtools-shared/src/devtools/views/Editor/EditorPane';

import {createElement} from 'react';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';
import Bridge from 'react-devtools-shared/src/bridge';
import Store from 'react-devtools-shared/src/devtools/store';
import {getBrowserTheme} from '../utils';
import {
  localStorageGetItem,
  localStorageSetItem,
} from 'react-devtools-shared/src/storage';
import DevTools from 'react-devtools-shared/src/devtools/views/DevTools';
import {
  LOCAL_STORAGE_SUPPORTS_PROFILING_KEY,
  LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY,
} from 'react-devtools-shared/src/constants';
import {logEvent} from 'react-devtools-shared/src/Logger';
import {
  getAlwaysOpenInEditor,
  getOpenInEditorURL,
  normalizeUrlIfValid,
} from 'react-devtools-shared/src/utils';
import {checkConditions} from 'react-devtools-shared/src/devtools/views/Editor/utils';
import * as parseHookNames from 'react-devtools-shared/src/hooks/parseHookNames';

import {
  setBrowserSelectionFromReact,
  setReactSelectionFromBrowser,
} from './elementSelection';
import {viewAttributeSource} from './sourceSelection';

import {startReactPolling} from './reactPolling';
import {cloneStyleTags} from './cloneStyleTags';
import fetchFileWithCaching from './fetchFileWithCaching';
import injectBackendManager from './injectBackendManager';
import registerEventsLogger from './registerEventsLogger';
import getProfilingFlags from './getProfilingFlags';
import debounce from './debounce';
import './requestAnimationFramePolyfill';

const resolvedParseHookNames = Promise.resolve(parseHookNames);
// DevTools assumes this is a dynamically imported module. Since we outline
// workers in this bundle, we can sync require the module since it's just a thin
// wrapper around calling the worker.
const hookNamesModuleLoaderFunction = () => resolvedParseHookNames;

function createBridge() {
  bridge = new Bridge({
    listen(fn) {
      const bridgeListener = message => fn(message);
      // Store the reference so that we unsubscribe from the same object.
      const portOnMessage = port.onMessage;
      portOnMessage.addListener(bridgeListener);

      lastSubscribedBridgeListener = bridgeListener;

      return () => {
        port?.onMessage.removeListener(bridgeListener);
        lastSubscribedBridgeListener = null;
      };
    },

    send(event: string, payload: any, transferable?: Array<any>) {
      port?.postMessage({event, payload}, transferable);
    },
  });

  bridge.addListener('reloadAppForProfiling', () => {
    localStorageSetItem(LOCAL_STORAGE_SUPPORTS_PROFILING_KEY, 'true');
    chrome.devtools.inspectedWindow.eval('window.location.reload();');
  });

  bridge.addListener(
    'syncSelectionToBuiltinElementsPanel',
    setBrowserSelectionFromReact,
  );

  bridge.addListener('extensionBackendInitialized', () => {
    // Initialize the renderer's trace-updates setting.
    // This handles the case of navigating to a new page after the DevTools have already been shown.
    bridge.send(
      'setTraceUpdatesEnabled',
      localStorageGetItem(LOCAL_STORAGE_TRACE_UPDATES_ENABLED_KEY) === 'true',
    );
  });

  const sourcesPanel = chrome.devtools.panels.sources;

  const onBrowserElementSelectionChanged = () =>
    setReactSelectionFromBrowser(bridge);
  const onBrowserSourceSelectionChanged = (location: {
    url: string,
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number,
  }) => {
    if (
      currentSelectedSource === null ||
      currentSelectedSource.url !== location.url
    ) {
      currentSelectedSource = {
        url: location.url,
        selectionRef: {
          // We use 1-based line and column, Chrome provides them 0-based.
          line: location.startLine + 1,
          column: location.startColumn + 1,
        },
      };
      // Rerender with the new file selection.
      render();
    } else {
      // Update the ref to the latest position without updating the url. No need to rerender.
      const selectionRef = currentSelectedSource.selectionRef;
      selectionRef.line = location.startLine + 1;
      selectionRef.column = location.startColumn + 1;
    }
  };
  const onBridgeShutdown = () => {
    chrome.devtools.panels.elements.onSelectionChanged.removeListener(
      onBrowserElementSelectionChanged,
    );
    if (sourcesPanel && sourcesPanel.onSelectionChanged) {
      currentSelectedSource = null;
      sourcesPanel.onSelectionChanged.removeListener(
        onBrowserSourceSelectionChanged,
      );
    }
  };

  bridge.addListener('shutdown', onBridgeShutdown);

  chrome.devtools.panels.elements.onSelectionChanged.addListener(
    onBrowserElementSelectionChanged,
  );
  if (sourcesPanel && sourcesPanel.onSelectionChanged) {
    sourcesPanel.onSelectionChanged.addListener(
      onBrowserSourceSelectionChanged,
    );
  }
}

function createBridgeAndStore() {
  createBridge();

  const {isProfiling} = getProfilingFlags();

  store = new Store(bridge, {
    isProfiling,
    supportsReloadAndProfile: __IS_CHROME__ || __IS_EDGE__,
    // At this time, the timeline can only parse Chrome performance profiles.
    supportsTimeline: __IS_CHROME__,
    supportsTraceUpdates: true,
    supportsInspectMatchingDOMElement: true,
    supportsClickToInspect: true,
  });

  store.addListener('enableSuspenseTab', () => {
    createSuspensePanel();
  });

  store.addListener('settingsUpdated', settings => {
    chrome.storage.local.set(settings);
  });

  if (!isProfiling) {
    // We previously stored this in performCleanup function
    store.profilerStore.profilingData = profilingData;
  }

  // Initialize the backend only once the Store has been initialized.
  // Otherwise, the Store may miss important initial tree op codes.
  injectBackendManager(chrome.devtools.inspectedWindow.tabId);

  const viewAttributeSourceFunction = (id, path) => {
    const rendererID = store.getRendererIDForElement(id);
    if (rendererID != null) {
      viewAttributeSource(rendererID, id, path);
    }
  };

  const viewElementSourceFunction = (source, symbolicatedSource) => {
    const [, sourceURL, line, column] = symbolicatedSource
      ? symbolicatedSource
      : source;

    // We use 1-based line and column, Chrome expects them 0-based.
    chrome.devtools.panels.openResource(
      normalizeUrlIfValid(sourceURL),
      line - 1,
      column - 1,
    );
  };

  root = createRoot(document.createElement('div'));

  render = (overrideTab = mostRecentOverrideTab) => {
    mostRecentOverrideTab = overrideTab;

    root.render(
      createElement(DevTools, {
        bridge,
        browserTheme: getBrowserTheme(),
        componentsPortalContainer,
        profilerPortalContainer,
        editorPortalContainer,
        currentSelectedSource,
        enabledInspectedElementContextMenu: true,
        fetchFileWithCaching,
        hookNamesModuleLoaderFunction,
        overrideTab,
        showTabBar: false,
        store,
        suspensePortalContainer,
        warnIfUnsupportedVersionDetected: true,
        viewAttributeSourceFunction,
        // Firefox doesn't support chrome.devtools.panels.openResource yet
        canViewElementSourceFunction: () => __IS_CHROME__ || __IS_EDGE__,
        viewElementSourceFunction,
      }),
    );
  };
}

function ensureInitialHTMLIsCleared(container) {
  if (container._hasInitialHTMLBeenCleared) {
    return;
  }

  container.innerHTML = '';
  container._hasInitialHTMLBeenCleared = true;
}

function createComponentsPanel() {
  if (componentsPortalContainer) {
    // Panel is created and user opened it at least once
    ensureInitialHTMLIsCleared(componentsPortalContainer);
    render('components');

    return;
  }

  if (componentsPanel) {
    // Panel is created, but wasn't opened yet, so no document is present for it
    return;
  }

  chrome.devtools.panels.create(
    __IS_CHROME__ || __IS_EDGE__ ? 'Components ⚛' : 'Components',
    __IS_EDGE__ ? 'icons/production.svg' : '',
    'panel.html',
    createdPanel => {
      componentsPanel = createdPanel;

      createdPanel.onShown.addListener(portal => {
        componentsPortalContainer = portal.container;
        if (componentsPortalContainer != null && render) {
          ensureInitialHTMLIsCleared(componentsPortalContainer);

          render('components');
          portal.injectStyles(cloneStyleTags);

          logEvent({event_name: 'selected-components-tab'});
        }
      });

      createdPanel.onShown.addListener(() => {
        bridge.emit('extensionComponentsPanelShown');
      });
      createdPanel.onHidden.addListener(() => {
        bridge.emit('extensionComponentsPanelHidden');
      });
    },
  );
}

function createProfilerPanel() {
  if (profilerPortalContainer) {
    // Panel is created and user opened it at least once
    ensureInitialHTMLIsCleared(profilerPortalContainer);
    render('profiler');

    return;
  }

  if (profilerPanel) {
    // Panel is created, but wasn't opened yet, so no document is present for it
    return;
  }

  chrome.devtools.panels.create(
    __IS_CHROME__ || __IS_EDGE__ ? 'Profiler ⚛' : 'Profiler',
    __IS_EDGE__ ? 'icons/production.svg' : '',
    'panel.html',
    createdPanel => {
      profilerPanel = createdPanel;

      createdPanel.onShown.addListener(portal => {
        profilerPortalContainer = portal.container;
        if (profilerPortalContainer != null && render) {
          ensureInitialHTMLIsCleared(profilerPortalContainer);

          render('profiler');
          portal.injectStyles(cloneStyleTags);

          logEvent({event_name: 'selected-profiler-tab'});
        }
      });
    },
  );
}

function createSourcesEditorPanel() {
  if (editorPortalContainer) {
    // Panel is created and user opened it at least once
    ensureInitialHTMLIsCleared(editorPortalContainer);
    render();

    return;
  }

  if (editorPane) {
    // Panel is created, but wasn't opened yet, so no document is present for it
    return;
  }

  const sourcesPanel = chrome.devtools.panels.sources;
  if (!sourcesPanel || !sourcesPanel.createSidebarPane) {
    // Firefox doesn't currently support extending the source panel.
    return;
  }

  sourcesPanel.createSidebarPane('Code Editor ⚛', createdPane => {
    editorPane = createdPane;

    createdPane.setPage('panel.html');
    createdPane.setHeight('75px');

    createdPane.onShown.addListener(portal => {
      editorPortalContainer = portal.container;
      if (editorPortalContainer != null && render) {
        ensureInitialHTMLIsCleared(editorPortalContainer);

        render();
        portal.injectStyles(cloneStyleTags);

        logEvent({event_name: 'selected-editor-pane'});
      }
    });

    createdPane.onShown.addListener(() => {
      bridge.emit('extensionEditorPaneShown');
    });
    createdPane.onHidden.addListener(() => {
      bridge.emit('extensionEditorPaneHidden');
    });
  });
}

function createSuspensePanel() {
  if (suspensePortalContainer) {
    // Panel is created and user opened it at least once
    ensureInitialHTMLIsCleared(suspensePortalContainer);
    render('suspense');

    return;
  }

  if (suspensePanel) {
    // Panel is created, but wasn't opened yet, so no document is present for it
    return;
  }

  chrome.devtools.panels.create(
    __IS_CHROME__ || __IS_EDGE__ ? 'Suspense ⚛' : 'Suspense',
    __IS_EDGE__ ? 'icons/production.svg' : '',
    'panel.html',
    createdPanel => {
      suspensePanel = createdPanel;

      createdPanel.onShown.addListener(portal => {
        suspensePortalContainer = portal.container;
        if (suspensePortalContainer != null && render) {
          ensureInitialHTMLIsCleared(suspensePortalContainer);

          render('suspense');
          portal.injectStyles(cloneStyleTags);

          logEvent({event_name: 'selected-suspense-tab'});
        }
      });
    },
  );
}

function performInTabNavigationCleanup() {
  // Potentially, if react hasn't loaded yet and user performs in-tab navigation
  clearReactPollingInstance();

  if (store !== null) {
    // Store profiling data, so it can be used later
    profilingData = store.profilerStore.profilingData;
  }

  // If panels were already created, and we have already mounted React root to display
  // tabs (Components or Profiler), we should unmount root first and render them again
  if (
    (componentsPortalContainer ||
      profilerPortalContainer ||
      suspensePortalContainer) &&
    root
  ) {
    // It's easiest to recreate the DevTools panel (to clean up potential stale state).
    // We can revisit this in the future as a small optimization.
    // This should also emit bridge.shutdown, but only if this root was mounted
    flushSync(() => root.unmount());
  } else {
    // In case Browser DevTools were opened, but user never pressed on extension panels
    // They were never mounted and there is nothing to unmount, but we need to emit shutdown event
    // because bridge was already created
    bridge?.shutdown();
  }

  // Do not nullify componentsPanelPortal and profilerPanelPortal on purpose,
  // They are not recreated when user does in-tab navigation, and they can only be accessed via
  // callback in onShown listener, which is called only when panel has been shown
  // This event won't be emitted again after in-tab navigation, if DevTools panel keeps being opened

  // Do not clean mostRecentOverrideTab on purpose, so we remember last opened
  // React DevTools tab, when user does in-tab navigation

  store = null;
  bridge = null;
  render = null;
  root = null;
}

function performFullCleanup() {
  // Potentially, if react hasn't loaded yet and user closed the browser DevTools
  clearReactPollingInstance();

  if (
    (componentsPortalContainer ||
      profilerPortalContainer ||
      suspensePortalContainer) &&
    root
  ) {
    // This should also emit bridge.shutdown, but only if this root was mounted
    flushSync(() => root.unmount());
  } else {
    bridge?.shutdown();
  }

  componentsPortalContainer = null;
  profilerPortalContainer = null;
  suspensePortalContainer = null;
  root = null;

  mostRecentOverrideTab = null;
  store = null;
  bridge = null;
  render = null;

  port?.disconnect();
  port = null;
}

function connectExtensionPort() {
  if (port) {
    throw new Error('DevTools port was already connected');
  }

  const tabId = chrome.devtools.inspectedWindow.tabId;
  port = chrome.runtime.connect({
    name: String(tabId),
  });

  // If DevTools port was reconnected and Bridge was already created
  // We should subscribe bridge to this port events
  // This could happen if service worker dies and all ports are disconnected,
  // but later user continues the session and Chrome reconnects all ports
  // Bridge object is still in-memory, though
  if (lastSubscribedBridgeListener) {
    port.onMessage.addListener(lastSubscribedBridgeListener);
  }

  // This port may be disconnected by Chrome at some point, this callback
  // will be executed only if this port was disconnected from the other end
  // so, when we call `port.disconnect()` from this script,
  // this should not trigger this callback and port reconnection
  port.onDisconnect.addListener(() => {
    port = null;
    connectExtensionPort();
  });
}

function mountReactDevTools() {
  reactPollingInstance = null;

  registerEventsLogger();

  createBridgeAndStore();

  createComponentsPanel();
  createProfilerPanel();
  createSourcesEditorPanel();
  // Suspense Tab is created via the hook
  // TODO(enableSuspenseTab): Create eagerly once Suspense tab is stable
}

let reactPollingInstance = null;
function clearReactPollingInstance() {
  reactPollingInstance?.abort();
  reactPollingInstance = null;
}

function showNoReactDisclaimer() {
  if (componentsPortalContainer) {
    componentsPortalContainer.innerHTML =
      '<h1 class="no-react-disclaimer">Looks like this page doesn\'t have React, or it hasn\'t been loaded yet.</h1>';
    delete componentsPortalContainer._hasInitialHTMLBeenCleared;
  }

  if (profilerPortalContainer) {
    profilerPortalContainer.innerHTML =
      '<h1 class="no-react-disclaimer">Looks like this page doesn\'t have React, or it hasn\'t been loaded yet.</h1>';
    delete profilerPortalContainer._hasInitialHTMLBeenCleared;
  }

  if (suspensePortalContainer) {
    suspensePortalContainer.innerHTML =
      '<h1 class="no-react-disclaimer">Looks like this page doesn\'t have React, or it hasn\'t been loaded yet.</h1>';
    delete suspensePortalContainer._hasInitialHTMLBeenCleared;
  }
}

function mountReactDevToolsWhenReactHasLoaded() {
  reactPollingInstance = startReactPolling(
    mountReactDevTools,
    5, // ~5 seconds
    showNoReactDisclaimer,
  );
}

let bridge = null;
let lastSubscribedBridgeListener = null;
let store = null;

let profilingData = null;

let componentsPanel = null;
let profilerPanel = null;
let suspensePanel = null;
let editorPane = null;
let componentsPortalContainer = null;
let profilerPortalContainer = null;
let suspensePortalContainer = null;
let editorPortalContainer = null;

let mostRecentOverrideTab = null;
let render = null;
let root = null;

let currentSelectedSource: null | SourceSelection = null;

let port = null;

// In case when multiple navigation events emitted in a short period of time
// This debounced callback primarily used to avoid mounting React DevTools multiple times, which results
// into subscribing to the same events from Bridge and window multiple times
// In this case, we will handle `operations` event twice or more and user will see
// `Cannot add node "1" because a node with that id is already in the Store.`
const debouncedMountReactDevToolsCallback = debounce(
  mountReactDevToolsWhenReactHasLoaded,
  500,
);

// Clean up everything, but start mounting React DevTools panels if user stays at this page
function onNavigatedToOtherPage() {
  performInTabNavigationCleanup();
  debouncedMountReactDevToolsCallback();
}

// Cleanup previous page state and remount everything
chrome.devtools.network.onNavigated.addListener(onNavigatedToOtherPage);

// Should be emitted when browser DevTools are closed
if (__IS_FIREFOX__) {
  // For some reason Firefox doesn't emit onBeforeUnload event
  window.addEventListener('unload', performFullCleanup);
} else {
  window.addEventListener('beforeunload', performFullCleanup);
}

connectExtensionPort();

mountReactDevToolsWhenReactHasLoaded();

function onThemeChanged(themeName) {
  // Rerender with the new theme
  render();
}

if (chrome.devtools.panels.setThemeChangeHandler) {
  // Chrome
  chrome.devtools.panels.setThemeChangeHandler(onThemeChanged);
} else if (chrome.devtools.panels.onThemeChanged) {
  // Firefox
  chrome.devtools.panels.onThemeChanged.addListener(onThemeChanged);
}

// Firefox doesn't support resources handlers yet.
if (chrome.devtools.panels.setOpenResourceHandler) {
  chrome.devtools.panels.setOpenResourceHandler(
    (
      resource,
      lineNumber = 1,
      // The column is a new feature so we have to specify a default if it doesn't exist
      columnNumber = 1,
    ) => {
      const alwaysOpenInEditor = getAlwaysOpenInEditor();
      const editorURL = getOpenInEditorURL();
      if (alwaysOpenInEditor && editorURL) {
        const location = ['', resource.url, lineNumber, columnNumber];
        const {url, shouldDisableButton} = checkConditions(editorURL, location);
        if (!shouldDisableButton) {
          window.open(url);
          return;
        }
      }
      // Otherwise fallback to the built-in behavior.
      chrome.devtools.panels.openResource(
        resource.url,
        lineNumber - 1,
        columnNumber - 1,
      );
    },
  );
}
