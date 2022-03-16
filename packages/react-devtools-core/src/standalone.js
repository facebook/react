/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createElement} from 'react';
import {
  // $FlowFixMe Flow does not yet know about flushSync()
  flushSync,
} from 'react-dom';
import {createRoot} from 'react-dom/client';
import Bridge from 'react-devtools-shared/src/bridge';
import Store from 'react-devtools-shared/src/devtools/store';
import {
  getAppendComponentStack,
  getBreakOnConsoleErrors,
  getSavedComponentFilters,
  getShowInlineWarningsAndErrors,
  getHideConsoleLogsInStrictMode,
} from 'react-devtools-shared/src/utils';
import {registerDevToolsEventLogger} from 'react-devtools-shared/src/registerDevToolsEventLogger';
import {Server} from 'ws';
import {join} from 'path';
import {readFileSync} from 'fs';
import {installHook} from 'react-devtools-shared/src/hook';
import DevTools from 'react-devtools-shared/src/devtools/views/DevTools';
import {doesFilePathExist, launchEditor} from './editor';
import {
  __DEBUG__,
  LOCAL_STORAGE_DEFAULT_TAB_KEY,
} from 'react-devtools-shared/src/constants';
import {localStorageSetItem} from '../../react-devtools-shared/src/storage';

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {InspectedElement} from 'react-devtools-shared/src/devtools/views/Components/types';

installHook(window);

export type StatusTypes = 'server-connected' | 'devtools-connected' | 'error';
export type StatusListener = (message: string, status: StatusTypes) => void;
export type OnDisconnectedCallback = () => void;

let node: HTMLElement = ((null: any): HTMLElement);
let nodeWaitingToConnectHTML: string = '';
let projectRoots: Array<string> = [];
let statusListener: StatusListener = (
  message: string,
  status?: StatusTypes,
) => {};
let disconnectedCallback: OnDisconnectedCallback = () => {};

// TODO (Webpack 5) Hopefully we can remove this prop after the Webpack 5 migration.
function hookNamesModuleLoaderFunction() {
  return import(
    /* webpackChunkName: 'parseHookNames' */ 'react-devtools-shared/src/hooks/parseHookNames'
  );
}

function setContentDOMNode(value: HTMLElement) {
  node = value;

  // Save so we can restore the exact waiting message between sessions.
  nodeWaitingToConnectHTML = node.innerHTML;

  return DevtoolsUI;
}

function setProjectRoots(value: Array<string>) {
  projectRoots = value;
}

function setStatusListener(value: StatusListener) {
  statusListener = value;
  return DevtoolsUI;
}

function setDisconnectedCallback(value: OnDisconnectedCallback) {
  disconnectedCallback = value;
  return DevtoolsUI;
}

let bridge: FrontendBridge | null = null;
let store: Store | null = null;
let root = null;

const log = (...args) => console.log('[React DevTools]', ...args);
log.warn = (...args) => console.warn('[React DevTools]', ...args);
log.error = (...args) => console.error('[React DevTools]', ...args);

function debug(methodName: string, ...args) {
  if (__DEBUG__) {
    console.log(
      `%c[core/standalone] %c${methodName}`,
      'color: teal; font-weight: bold;',
      'font-weight: bold;',
      ...args,
    );
  }
}

function safeUnmount() {
  flushSync(() => {
    if (root !== null) {
      root.unmount();
      root = null;
    }
  });
}

function reload() {
  safeUnmount();

  node.innerHTML = '';

  setTimeout(() => {
    root = createRoot(node);
    root.render(
      createElement(DevTools, {
        bridge: ((bridge: any): FrontendBridge),
        canViewElementSourceFunction,
        hookNamesModuleLoaderFunction,
        showTabBar: true,
        store: ((store: any): Store),
        warnIfLegacyBackendDetected: true,
        viewElementSourceFunction,
      }),
    );
  }, 100);
}

function canViewElementSourceFunction(
  inspectedElement: InspectedElement,
): boolean {
  if (
    inspectedElement.canViewSource === false ||
    inspectedElement.source === null
  ) {
    return false;
  }

  const {source} = inspectedElement;

  return doesFilePathExist(source.fileName, projectRoots);
}

function viewElementSourceFunction(
  id: number,
  inspectedElement: InspectedElement,
): void {
  const {source} = inspectedElement;
  if (source !== null) {
    launchEditor(source.fileName, source.lineNumber, projectRoots);
  } else {
    log.error('Cannot inspect element', id);
  }
}

function onDisconnected() {
  safeUnmount();

  node.innerHTML = nodeWaitingToConnectHTML;

  disconnectedCallback();
}

function onError({code, message}) {
  safeUnmount();

  if (code === 'EADDRINUSE') {
    node.innerHTML = `
      <div class="box">
        <div class="box-header">
          Another instance of DevTools is running.
        </div>
        <div class="box-content">
          Only one copy of DevTools can be used at a time.
        </div>
      </div>
    `;
  } else {
    node.innerHTML = `
      <div class="box">
        <div class="box-header">
          Unknown error
        </div>
        <div class="box-content">
          ${message}
        </div>
      </div>
    `;
  }
}

function openProfiler() {
  // Mocked up bridge and store to allow the DevTools to be rendered
  bridge = new Bridge({listen: () => {}, send: () => {}});
  store = new Store(bridge, {});

  // Ensure the Profiler tab is shown initially.
  localStorageSetItem(
    LOCAL_STORAGE_DEFAULT_TAB_KEY,
    JSON.stringify('profiler'),
  );

  reload();
}

function initialize(socket: WebSocket) {
  const listeners = [];
  socket.onmessage = event => {
    let data;
    try {
      if (typeof event.data === 'string') {
        data = JSON.parse(event.data);

        if (__DEBUG__) {
          debug('WebSocket.onmessage', data);
        }
      } else {
        throw Error();
      }
    } catch (e) {
      log.error('Failed to parse JSON', event.data);
      return;
    }
    listeners.forEach(fn => {
      try {
        fn(data);
      } catch (error) {
        log.error('Error calling listener', data);
        throw error;
      }
    });
  };

  bridge = new Bridge({
    listen(fn) {
      listeners.push(fn);
      return () => {
        const index = listeners.indexOf(fn);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      };
    },
    send(event: string, payload: any, transferable?: Array<any>) {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({event, payload}));
      }
    },
  });
  ((bridge: any): FrontendBridge).addListener('shutdown', () => {
    socket.close();
  });

  store = new Store(bridge, {
    checkBridgeProtocolCompatibility: true,
    supportsNativeInspection: false,
  });

  log('Connected');
  statusListener('DevTools initialized.', 'devtools-connected');
  reload();
}

let startServerTimeoutID: TimeoutID | null = null;

function connectToSocket(socket: WebSocket) {
  socket.onerror = err => {
    onDisconnected();
    log.error('Error with websocket connection', err);
  };
  socket.onclose = () => {
    onDisconnected();
    log('Connection to RN closed');
  };
  initialize(socket);

  return {
    close: function() {
      onDisconnected();
    },
  };
}

type ServerOptions = {|
  key?: string,
  cert?: string,
|};

type LoggerOptions = {|
  surface?: ?string,
|};

function startServer(
  port?: number = 8097,
  host?: string = 'localhost',
  httpsOptions?: ServerOptions,
  loggerOptions?: LoggerOptions,
) {
  registerDevToolsEventLogger(loggerOptions?.surface ?? 'standalone');

  const useHttps = !!httpsOptions;
  const httpServer = useHttps
    ? require('https').createServer(httpsOptions)
    : require('http').createServer();
  const server = new Server({server: httpServer});
  let connected: WebSocket | null = null;
  server.on('connection', (socket: WebSocket) => {
    if (connected !== null) {
      connected.close();
      log.warn(
        'Only one connection allowed at a time.',
        'Closing the previous connection',
      );
    }
    connected = socket;
    socket.onerror = error => {
      connected = null;
      onDisconnected();
      log.error('Error with websocket connection', error);
    };
    socket.onclose = () => {
      connected = null;
      onDisconnected();
      log('Connection to RN closed');
    };
    initialize(socket);
  });

  server.on('error', event => {
    onError(event);
    log.error('Failed to start the DevTools server', event);
    startServerTimeoutID = setTimeout(() => startServer(port), 1000);
  });

  httpServer.on('request', (request, response) => {
    // Serve a file that immediately sets up the connection.
    const backendFile = readFileSync(join(__dirname, 'backend.js'));

    // The renderer interface doesn't read saved component filters directly,
    // because they are generally stored in localStorage within the context of the extension.
    // Because of this it relies on the extension to pass filters, so include them wth the response here.
    // This will ensure that saved filters are shared across different web pages.
    const savedPreferencesString = `
      window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = ${JSON.stringify(
        getAppendComponentStack(),
      )};
      window.__REACT_DEVTOOLS_BREAK_ON_CONSOLE_ERRORS__ = ${JSON.stringify(
        getBreakOnConsoleErrors(),
      )};
      window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = ${JSON.stringify(
        getSavedComponentFilters(),
      )};
      window.__REACT_DEVTOOLS_SHOW_INLINE_WARNINGS_AND_ERRORS__ = ${JSON.stringify(
        getShowInlineWarningsAndErrors(),
      )};
      window.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ = ${JSON.stringify(
        getHideConsoleLogsInStrictMode(),
      )};`;

    response.end(
      savedPreferencesString +
        '\n;' +
        backendFile.toString() +
        '\n;' +
        `ReactDevToolsBackend.connectToDevTools({port: ${port}, host: '${host}', useHttps: ${
          useHttps ? 'true' : 'false'
        }});`,
    );
  });

  httpServer.on('error', event => {
    onError(event);
    statusListener('Failed to start the server.', 'error');
    startServerTimeoutID = setTimeout(() => startServer(port), 1000);
  });

  httpServer.listen(port, () => {
    statusListener(
      'The server is listening on the port ' + port + '.',
      'server-connected',
    );
  });

  return {
    close: function() {
      connected = null;
      onDisconnected();
      if (startServerTimeoutID !== null) {
        clearTimeout(startServerTimeoutID);
      }
      server.close();
      httpServer.close();
    },
  };
}

const DevtoolsUI = {
  connectToSocket,
  setContentDOMNode,
  setProjectRoots,
  setStatusListener,
  setDisconnectedCallback,
  startServer,
  openProfiler,
};

export default DevtoolsUI;
