/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const path = require('path');

import {patchSetImmediate} from '../../../../scripts/jest/patchSetImmediate';

let React;
// let ReactServer;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Stream;

// We test pass-through without encoding strings but it should work without it too.
const streamOptions = {
  objectMode: true,
};

const repoRoot = path.resolve(__dirname, '../../../../');

function normalizeStack(stack) {
  if (!stack) {
    return stack;
  }
  const copy = [];
  for (let i = 0; i < stack.length; i++) {
    const [name, file, line, col, enclosingLine, enclosingCol] = stack[i];
    copy.push([
      name,
      file.replace(repoRoot, ''),
      line,
      col,
      enclosingLine,
      enclosingCol,
    ]);
  }
  return copy;
}

function normalizeIOInfo(ioInfo) {
  const {debugTask, debugStack, ...copy} = ioInfo;
  if (ioInfo.stack) {
    copy.stack = normalizeStack(ioInfo.stack);
  }
  if (typeof ioInfo.start === 'number') {
    copy.start = 0;
  }
  if (typeof ioInfo.end === 'number') {
    copy.end = 0;
  }
  return copy;
}

function normalizeDebugInfo(debugInfo) {
  if (Array.isArray(debugInfo.stack)) {
    const {debugTask, debugStack, ...copy} = debugInfo;
    copy.stack = normalizeStack(debugInfo.stack);
    if (debugInfo.owner) {
      copy.owner = normalizeDebugInfo(debugInfo.owner);
    }
    if (debugInfo.awaited) {
      copy.awaited = normalizeIOInfo(copy.awaited);
    }
    return copy;
  } else if (typeof debugInfo.time === 'number') {
    return {...debugInfo, time: 0};
  } else if (debugInfo.awaited) {
    return {...debugInfo, awaited: normalizeIOInfo(debugInfo.awaited)};
  } else {
    return debugInfo;
  }
}

function getDebugInfo(obj) {
  const debugInfo = obj._debugInfo;
  if (debugInfo) {
    const copy = [];
    for (let i = 0; i < debugInfo.length; i++) {
      copy.push(normalizeDebugInfo(debugInfo[i]));
    }
    return copy;
  }
  return debugInfo;
}

describe('ReactFlightAsyncDebugInfoNode', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useRealTimers();
    patchSetImmediate();
    global.console = require('console');

    // Simulate the condition resolution
    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      require('react-server-dom-webpack/server.node'),
    );
    // ReactServer = require('react');
    ReactServerDOMServer = require('react-server-dom-webpack/server');

    jest.resetModules();
    jest.useRealTimers();
    patchSetImmediate();

    __unmockReact();
    jest.unmock('react-server-dom-webpack/server');
    jest.mock('react-server-dom-webpack/client', () =>
      require('react-server-dom-webpack/client.node'),
    );

    // React = require('react');
    ReactServerDOMClient = require('react-server-dom-webpack/client');
    Stream = require('stream');
  });

  function delay(timeout) {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  }

  // @gate __DEV__ && enableComponentPerformanceTrack
  it('can track async information when awaited', async () => {
    async function getData() {
      await delay(1);
      const promise = delay(2);
      await Promise.all([promise]);
      return 'hi';
    }

    async function Component() {
      const result = await getData();
      return result;
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(<Component />);

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('hi');
    const debugInfo = getDebugInfo(result);
    expect(debugInfo.length).toBe(5);
    expect(getDebugInfo(result)).toMatchSnapshot();
  });

  // @gate __DEV__ && enableComponentPerformanceTrack
  it('can track the start of I/O when no native promise is used', async () => {
    function Component() {
      const callbacks = [];
      setTimeout(function timer() {
        callbacks.forEach(callback => callback('hi'));
      }, 5);
      return {
        then(callback) {
          callbacks.push(callback);
        },
      };
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(<Component />);

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('hi');
    const debugInfo = getDebugInfo(result);
    expect(debugInfo.length).toBe(4);
    expect(debugInfo).toMatchSnapshot();
  });
});
