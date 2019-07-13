// @flow

import { createElement } from 'react';
import {
  // $FlowFixMe Flow does not yet know about flushSync()
  flushSync,
  // $FlowFixMe Flow does not yet know about createRoot()
  unstable_createRoot as createRoot,
} from 'react-dom';
import Bridge from 'src/bridge';
import Store from 'src/devtools/store';
import { getSavedComponentFilters } from 'src/utils';
import { Server } from 'ws';
import { existsSync, readFileSync } from 'fs';
import { installHook } from 'src/hook';
import DevTools from 'src/devtools/views/DevTools';
import launchEditor from './launchEditor';
import { __DEBUG__ } from 'src/constants';

import type { InspectedElement } from 'src/devtools/views/Components/types';

installHook(window);

export type StatusListener = (message: string) => void;

let node: HTMLElement = ((null: any): HTMLElement);
let nodeWaitingToConnectHTML: string = '';
let projectRoots: Array<string> = [];
let statusListener: StatusListener = (message: string) => {};

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

let bridge: Bridge | null = null;
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
      ...args
    );
  }
}

function safeUnmount() {
  flushSync(() => {
    if (root !== null) {
      root.unmount();
    }
  });
  root = null;
}

function reload() {
  safeUnmount();

  node.innerHTML = '';

  setTimeout(() => {
    root = createRoot(node);
    root.render(
      createElement(DevTools, {
        bridge: ((bridge: any): Bridge),
        showTabBar: true,
        store: ((store: any): Store),
        viewElementSourceFunction,
        viewElementSourceRequiresFileLocation: true,
      })
    );
  }, 100);
}

function viewElementSourceFunction(
  id: number,
  inspectedElement: InspectedElement
): void {
  const { source } = inspectedElement;
  if (source !== null) {
    launchEditor(source.fileName, source.lineNumber, projectRoots);
  } else {
    log.error('Cannot inspect element', id);
  }
}

function onDisconnected() {
  safeUnmount();

  node.innerHTML = nodeWaitingToConnectHTML;
}

function onError({ code, message }) {
  safeUnmount();

  if (code === 'EADDRINUSE') {
    node.innerHTML = `<div id="waiting"><h2>Another instance of DevTools is running</h2></div>`;
  } else {
    node.innerHTML = `<div id="waiting"><h2>Unknown error (${message})</h2></div>`;
  }
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
        socket.send(JSON.stringify({ event, payload }));
      }
    },
  });
  ((bridge: any): Bridge).addListener('shutdown', () => {
    socket.close();
  });

  store = new Store(bridge, { supportsNativeInspection: false });

  log('Connected');
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

function startServer(port?: number = 8097) {
  const httpServer = require('http').createServer();
  const server = new Server({ server: httpServer });
  let connected: WebSocket | null = null;
  server.on('connection', (socket: WebSocket) => {
    if (connected !== null) {
      connected.close();
      log.warn(
        'Only one connection allowed at a time.',
        'Closing the previous connection'
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
    // NPM installs should read from node_modules,
    // But local dev mode needs to use a relative path.
    const basePath = existsSync('./node_modules/react-devtools-core')
      ? 'node_modules/react-devtools-core'
      : '../react-devtools-core';

    // Serve a file that immediately sets up the connection.
    const backendFile = readFileSync(`${basePath}/dist/backend.js`);

    // The renderer interface doesn't read saved component filters directly,
    // because they are generally stored in localStorage within the context of the extension.
    // Because of this it relies on the extension to pass filters, so include them wth the response here.
    // This will ensure that saved filters are shared across different web pages.
    const savedFiltersString = `window.__REACT_DEVTOOLS_COMPONENT_FILTERS__ = ${JSON.stringify(
      getSavedComponentFilters()
    )};`;

    response.end(
      savedFiltersString +
        '\n;' +
        backendFile.toString() +
        '\n;' +
        'ReactDevToolsBackend.connectToDevTools();'
    );
  });

  httpServer.on('error', event => {
    onError(event);
    statusListener('Failed to start the server.');
    startServerTimeoutID = setTimeout(() => startServer(port), 1000);
  });

  httpServer.listen(port, () => {
    statusListener('The server is listening on the port ' + port + '.');
  });

  return {
    close: function() {
      connected = null;
      onDisconnected();
      clearTimeout(startServerTimeoutID);
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
  startServer,
};

export default DevtoolsUI;
