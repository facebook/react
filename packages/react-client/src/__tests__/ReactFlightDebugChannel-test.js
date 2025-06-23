/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

if (typeof Blob === 'undefined') {
  global.Blob = require('buffer').Blob;
}
if (typeof File === 'undefined' || typeof FormData === 'undefined') {
  global.File = require('undici').File;
  global.FormData = require('undici').FormData;
}

function formatV8Stack(stack) {
  let v8StyleStack = '';
  if (stack) {
    for (let i = 0; i < stack.length; i++) {
      const [name] = stack[i];
      if (v8StyleStack !== '') {
        v8StyleStack += '\n';
      }
      v8StyleStack += '    in ' + name + ' (at **)';
    }
  }
  return v8StyleStack;
}

function normalizeComponentInfo(debugInfo) {
  if (Array.isArray(debugInfo.stack)) {
    const {debugTask, debugStack, ...copy} = debugInfo;
    copy.stack = formatV8Stack(debugInfo.stack);
    if (debugInfo.owner) {
      copy.owner = normalizeComponentInfo(debugInfo.owner);
    }
    return copy;
  } else {
    return debugInfo;
  }
}

function getDebugInfo(obj) {
  const debugInfo = obj._debugInfo;
  if (debugInfo) {
    const copy = [];
    for (let i = 0; i < debugInfo.length; i++) {
      copy.push(normalizeComponentInfo(debugInfo[i]));
    }
    return copy;
  }
  return debugInfo;
}

let act;
let React;
let ReactNoop;
let ReactNoopFlightServer;
let ReactNoopFlightClient;

describe('ReactFlight', () => {
  beforeEach(() => {
    // Mock performance.now for timing tests
    let time = 10;
    const now = jest.fn().mockImplementation(() => {
      return time++;
    });
    Object.defineProperty(performance, 'timeOrigin', {
      value: time,
      configurable: true,
    });
    Object.defineProperty(performance, 'now', {
      value: now,
      configurable: true,
    });

    jest.resetModules();
    jest.mock('react', () => require('react/react.react-server'));
    ReactNoopFlightServer = require('react-noop-renderer/flight-server');
    // This stores the state so we need to preserve it
    const flightModules = require('react-noop-renderer/flight-modules');
    jest.resetModules();
    __unmockReact();
    jest.mock('react-noop-renderer/flight-modules', () => flightModules);
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    ReactNoopFlightClient = require('react-noop-renderer/flight-client');
    act = require('internal-test-utils').act;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // @gate __DEV__ && enableComponentPerformanceTrack
  it('can render deep but cut off JSX in debug info', async () => {
    function createDeepJSX(n) {
      if (n <= 0) {
        return null;
      }
      return <div>{createDeepJSX(n - 1)}</div>;
    }

    function ServerComponent(props) {
      return <div>not using props</div>;
    }

    const debugChannel = {onMessage(message) {}};

    const transport = ReactNoopFlightServer.render(
      {
        root: (
          <ServerComponent>
            {createDeepJSX(100) /* deper than objectLimit */}
          </ServerComponent>
        ),
      },
      {debugChannel},
    );

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport, {
        debugChannel,
      });
      const root = rootModel.root;
      const children = getDebugInfo(root)[1].props.children;
      expect(children.type).toBe('div');
      expect(children.props.children.type).toBe('div');
      ReactNoop.render(root);
    });

    expect(ReactNoop).toMatchRenderedOutput(<div>not using props</div>);
  });
});
