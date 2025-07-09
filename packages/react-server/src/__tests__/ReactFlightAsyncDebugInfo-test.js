'use strict';

const path = require('path');

import {patchSetImmediate} from '../../../../scripts/jest/patchSetImmediate';

let React;
let ReactServer;
let cache;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Stream;

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
  const {debugTask, debugStack, debugLocation, ...copy} = ioInfo;
  if (ioInfo.stack) {
    copy.stack = normalizeStack(ioInfo.stack);
  }
  if (ioInfo.owner) {
    copy.owner = normalizeDebugInfo(ioInfo.owner);
  }
  if (typeof ioInfo.start === 'number') {
    copy.start = 0;
  }
  if (typeof ioInfo.end === 'number') {
    copy.end = 0;
  }
  const promise = ioInfo.value;
  if (promise) {
    promise.then(); // init
    if (promise.status === 'fulfilled') {
      copy.value = {
        value: promise.value,
      };
    } else if (promise.status === 'rejected') {
      copy.value = {
        reason: promise.reason,
      };
    } else {
      copy.value = {
        status: promise.status,
      };
    }
  }
  return copy;
}

function normalizeDebugInfo(debugInfo) {
  if (Array.isArray(debugInfo.stack)) {
    const {debugTask, debugStack, debugLocation, ...copy} = debugInfo;
    copy.stack = normalizeStack(debugInfo.stack);
    if (debugInfo.owner) {
      copy.owner = normalizeDebugInfo(debugInfo.owner);
    }
    if (debugInfo.awaited) {
      copy.awaited = normalizeIOInfo(copy.awaited);
    }
    if (debugInfo.props) {
      copy.props = {};
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

function filterStackFrame(filename, functionName) {
  return (
    filename !== '' &&
    !filename.startsWith('node:') &&
    !filename.includes('node_modules') &&
    // Filter out our own internal source code since it'll typically be in node_modules
    (!filename.includes('/packages/') || filename.includes('/__tests__/')) &&
    !filename.includes('/build/') &&
    !functionName.includes('internal_')
  );
}

describe('ReactFlightAsyncDebugInfo', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useRealTimers();
    patchSetImmediate();
    global.console = require('console');

    jest.mock('react', () => require('react/react.react-server'));
    jest.mock('react-server-dom-webpack/server', () =>
      require('react-server-dom-webpack/server.node'),
    );
    ReactServer = require('react');
    ReactServerDOMServer = require('react-server-dom-webpack/server');
    cache = ReactServer.cache;

    jest.resetModules();
    jest.useRealTimers();
    patchSetImmediate();

    __unmockReact();
    jest.unmock('react-server-dom-webpack/server');
    jest.mock('react-server-dom-webpack/client', () =>
      require('react-server-dom-webpack/client.node'),
    );

    React = require('react');
    ReactServerDOMClient = require('react-server-dom-webpack/client');
    Stream = require('stream');
  });

  function finishLoadingStream(readable) {
    return new Promise(resolve => {
      if (readable.readableEnded) {
        resolve();
      } else {
        readable.on('end', () => resolve());
      }
    });
  }

  function delay(timeout) {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  }

  function fetchThirdParty(Component) {
    const stream = ReactServerDOMServer.renderToPipeableStream(
      <Component />,
      {},
      {
        environmentName: 'third-party',
      },
    );
    const readable = new Stream.PassThrough(streamOptions);
    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);
    return result;
  }

  it('can track async information when awaited', async () => {
    async function getData(text) {
      await delay(1);
      const promise = delay(2);
      await Promise.all([promise]);
      return text.toUpperCase();
    }

    async function Component() {
      const result = await getData('hi');
      const moreData = getData('seb');
      return <InnerComponent text={result} promise={moreData} />;
    }

    async function InnerComponent({text, promise}) {
      // This async function depends on the I/O in parent components but it should not
      // include that I/O as part of its own meta data.
      return text + ', ' + (await promise);
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(<Component />);

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('HI, SEB');

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Component",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                203,
                109,
                183,
                50,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    203,
                    109,
                    183,
                    50,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  185,
                  13,
                  184,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  192,
                  26,
                  191,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Component",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  203,
                  109,
                  183,
                  50,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                185,
                13,
                184,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                192,
                26,
                191,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    203,
                    109,
                    183,
                    50,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  186,
                  21,
                  184,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  192,
                  20,
                  191,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": [
                  ,
                ],
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Component",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  203,
                  109,
                  183,
                  50,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                187,
                21,
                184,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                192,
                20,
                191,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "InnerComponent",
            "props": {},
            "stack": [
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                194,
                60,
                191,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    203,
                    109,
                    183,
                    50,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  186,
                  21,
                  184,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "status": "halted",
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "InnerComponent",
              "props": {},
              "stack": [
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  194,
                  60,
                  191,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "InnerComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                200,
                35,
                197,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });

  it('can track async information when use()d', async () => {
    async function getData(text) {
      await delay(1);
      return text.toUpperCase();
    }

    function Component() {
      const result = ReactServer.use(getData('hi'));
      const moreData = getData('seb');
      return <InnerComponent text={result} promise={moreData} />;
    }

    function InnerComponent({text, promise}) {
      // This async function depends on the I/O in parent components but it should not
      // include that I/O as part of its own meta data.
      return text + ', ' + ReactServer.use(promise);
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(
      <Component />,
      {},
      {
        filterStackFrame,
      },
    );

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('HI, SEB');

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Component",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                558,
                40,
                539,
                49,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    558,
                    40,
                    539,
                    49,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  541,
                  13,
                  540,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  546,
                  36,
                  545,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Component",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  558,
                  40,
                  539,
                  49,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                541,
                13,
                540,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                546,
                36,
                545,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "InnerComponent",
            "props": {},
            "stack": [
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                548,
                60,
                545,
                5,
              ],
            ],
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    558,
                    40,
                    539,
                    49,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  541,
                  13,
                  540,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  547,
                  22,
                  545,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "InnerComponent",
              "props": {},
              "stack": [
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  548,
                  60,
                  545,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "InnerComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                554,
                40,
                551,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });

  it('cannot currently track the start of I/O when no native promise is used', async () => {
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

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Component",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                821,
                109,
                808,
                80,
              ],
            ],
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    821,
                    109,
                    808,
                    80,
                  ],
                ],
              },
              "start": 0,
            },
            "env": "Server",
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });

  it('can ingores the start of I/O when immediately resolved non-native promise is awaited', async () => {
    async function Component() {
      return await {
        then(callback) {
          callback('hi');
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

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Component",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                907,
                109,
                898,
                94,
              ],
            ],
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });

  it('forwards debugInfo from awaited Promises', async () => {
    async function Component() {
      let resolve;
      const promise = new Promise(r => (resolve = r));
      promise._debugInfo = [
        {time: performance.now()},
        {
          name: 'Virtual Component',
        },
        {time: performance.now()},
      ];
      const promise2 = promise.then(value => value);
      promise2._debugInfo = [
        {time: performance.now()},
        {
          name: 'Virtual Component2',
        },
        {time: performance.now()},
      ];
      resolve('hi');
      const result = await promise2;
      return result.toUpperCase();
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(<Component />);

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('HI');

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Component",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                980,
                109,
                956,
                50,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "name": "Virtual Component",
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
          {
            "name": "Virtual Component2",
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });

  it('forwards async debug info one environment to the next', async () => {
    async function getData() {
      await delay(1);
      await delay(2);
      return 'hi';
    }

    async function ThirdPartyComponent() {
      const data = await getData();
      return data;
    }

    async function Component() {
      const data = await fetchThirdParty(ThirdPartyComponent);
      return data.toUpperCase();
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(<Component />);

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('HI');

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Component",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1064,
                109,
                1047,
                63,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "env": "third-party",
            "key": null,
            "name": "ThirdPartyComponent",
            "props": {},
            "stack": [
              [
                "fetchThirdParty",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                168,
                40,
                166,
                3,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1060,
                24,
                1059,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "third-party",
              "name": "delay",
              "owner": {
                "env": "third-party",
                "key": null,
                "name": "ThirdPartyComponent",
                "props": {},
                "stack": [
                  [
                    "fetchThirdParty",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    168,
                    40,
                    166,
                    3,
                  ],
                  [
                    "Component",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1060,
                    24,
                    1059,
                    5,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1049,
                  13,
                  1048,
                  5,
                ],
                [
                  "ThirdPartyComponent",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1055,
                  24,
                  1054,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "third-party",
            "owner": {
              "env": "third-party",
              "key": null,
              "name": "ThirdPartyComponent",
              "props": {},
              "stack": [
                [
                  "fetchThirdParty",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  168,
                  40,
                  166,
                  3,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1060,
                  24,
                  1059,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1049,
                13,
                1048,
                5,
              ],
              [
                "ThirdPartyComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1055,
                24,
                1054,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "third-party",
              "name": "delay",
              "owner": {
                "env": "third-party",
                "key": null,
                "name": "ThirdPartyComponent",
                "props": {},
                "stack": [
                  [
                    "fetchThirdParty",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    168,
                    40,
                    166,
                    3,
                  ],
                  [
                    "Component",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1060,
                    24,
                    1059,
                    5,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1050,
                  13,
                  1048,
                  5,
                ],
                [
                  "ThirdPartyComponent",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1055,
                  18,
                  1054,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "third-party",
            "owner": {
              "env": "third-party",
              "key": null,
              "name": "ThirdPartyComponent",
              "props": {},
              "stack": [
                [
                  "fetchThirdParty",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  168,
                  40,
                  166,
                  3,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1060,
                  24,
                  1059,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1050,
                13,
                1048,
                5,
              ],
              [
                "ThirdPartyComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1055,
                18,
                1054,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });

  it('can track cached entries awaited in later components', async () => {
    const getData = cache(async function getData(text) {
      await delay(1);
      return text.toUpperCase();
    });

    async function Child() {
      const greeting = await getData('hi');
      return greeting + ', Seb';
    }

    async function Component() {
      await getData('hi');
      return <Child />;
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(
      <Component />,
      {},
      {
        filterStackFrame,
      },
    );

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('HI, Seb');

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Component",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1380,
                40,
                1363,
                62,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1380,
                    40,
                    1363,
                    62,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1365,
                  13,
                  1364,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1375,
                  13,
                  1374,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Component",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1380,
                  40,
                  1363,
                  62,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1365,
                13,
                1364,
                25,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1375,
                13,
                1374,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Child",
            "props": {},
            "stack": [
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1376,
                60,
                1374,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1380,
                    40,
                    1363,
                    62,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1365,
                  13,
                  1364,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1375,
                  13,
                  1374,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Child",
              "props": {},
              "stack": [
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1376,
                  60,
                  1374,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "Child",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1370,
                28,
                1369,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });

  it('can track cached entries used in child position', async () => {
    const getData = cache(async function getData(text) {
      await delay(1);
      return text.toUpperCase();
    });

    function Child() {
      return getData('hi');
    }

    function Component() {
      ReactServer.use(getData('hi'));
      return <Child />;
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(
      <Component />,
      {},
      {
        filterStackFrame,
      },
    );

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('HI');

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Component",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1649,
                40,
                1633,
                57,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1649,
                    40,
                    1633,
                    57,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1635,
                  13,
                  1634,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1644,
                  23,
                  1643,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Component",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1649,
                  40,
                  1633,
                  57,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1635,
                13,
                1634,
                25,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1644,
                23,
                1643,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Child",
            "props": {},
            "stack": [
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1645,
                60,
                1643,
                5,
              ],
            ],
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1649,
                    40,
                    1633,
                    57,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1635,
                  13,
                  1634,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1644,
                  23,
                  1643,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });

  it('can track implicit returned promises that are blocked by previous data', async () => {
    async function delayTwice() {
      await delay('', 20);
      await delay('', 10);
    }

    async function delayTrice() {
      const p = delayTwice();
      await delay('', 40);
      return p;
    }

    async function Bar({children}) {
      await delayTrice();
      return 'hi';
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(
      <Bar />,
      {},
      {
        filterStackFrame,
      },
    );

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('hi');

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Bar",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1891,
                40,
                1873,
                80,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Bar",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1891,
                    40,
                    1873,
                    80,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "delayTrice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1881,
                  13,
                  1879,
                  5,
                ],
                [
                  "Bar",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1886,
                  13,
                  1885,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Bar",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1891,
                  40,
                  1873,
                  80,
                ],
              ],
            },
            "stack": [
              [
                "delayTrice",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1881,
                13,
                1879,
                5,
              ],
              [
                "Bar",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1886,
                13,
                1885,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Bar",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1891,
                    40,
                    1873,
                    80,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "delayTwice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1875,
                  13,
                  1874,
                  5,
                ],
                [
                  "delayTrice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1880,
                  15,
                  1879,
                  5,
                ],
                [
                  "Bar",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1886,
                  13,
                  1885,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Bar",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1891,
                  40,
                  1873,
                  80,
                ],
              ],
            },
            "stack": [
              [
                "delayTwice",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1875,
                13,
                1874,
                5,
              ],
              [
                "delayTrice",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1880,
                15,
                1879,
                5,
              ],
              [
                "Bar",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1886,
                13,
                1885,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Bar",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1891,
                    40,
                    1873,
                    80,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "delayTwice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1876,
                  13,
                  1874,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Bar",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1891,
                  40,
                  1873,
                  80,
                ],
              ],
            },
            "stack": [
              [
                "delayTwice",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1876,
                13,
                1874,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });

  it('can track IO that is chained via then(async ...)', async () => {
    function getData(text) {
      return delay(1).then(async () => {
        return text.toUpperCase();
      });
    }

    async function Component({text, promise}) {
      return await getData('hi, sebbie');
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(<Component />);

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('HI, SEBBIE');

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Component",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2232,
                109,
                2221,
                58,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    2232,
                    109,
                    2221,
                    58,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2223,
                  14,
                  2222,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2229,
                  20,
                  2228,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Component",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2232,
                  109,
                  2221,
                  58,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2223,
                23,
                2222,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2229,
                20,
                2228,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });

  it('can track IO that is not awaited in user space', async () => {
    function internal_API(text) {
      return delay(1).then(async () => {
        return text.toUpperCase();
      });
    }

    async function Component({text, promise}) {
      return await internal_API('hi, seb');
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(
      <Component />,
      {},
      {
        filterStackFrame,
      },
    );

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('HI, SEB');

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Component",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2387,
                40,
                2375,
                56,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "delay",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    2387,
                    40,
                    2375,
                    56,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  161,
                  12,
                  160,
                  3,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2383,
                  20,
                  2382,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": "HI, SEB",
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Component",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2387,
                  40,
                  2375,
                  56,
                ],
              ],
            },
            "stack": [
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2383,
                20,
                2382,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });

  it('can track IO in third-party code', async () => {
    async function thirdParty(endpoint) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve('third-party ' + endpoint);
        }, 10);
      }).then(async value => {
        await new Promise(resolve => {
          setTimeout(resolve, 10);
        });

        return value;
      });
    }

    async function Component() {
      const value = await thirdParty('hi');
      return value;
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(
      <Component />,
      {},
      {
        filterStackFrame(filename, functionName) {
          if (functionName === 'thirdParty') {
            return false;
          }
          return filterStackFrame(filename, functionName);
        },
      },
    );

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('third-party hi');

    await finishLoadingStream(readable);
    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      expect(getDebugInfo(result)).toMatchInlineSnapshot(`
        [
          {
            "time": 0,
          },
          {
            "env": "Server",
            "key": null,
            "name": "Component",
            "props": {},
            "stack": [
              [
                "Object.<anonymous>",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2540,
                40,
                2519,
                42,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    2540,
                    40,
                    2519,
                    42,
                  ],
                ],
              },
              "stack": [
                [
                  "",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2526,
                  15,
                  2525,
                  15,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2535,
                  19,
                  2534,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Component",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2540,
                  40,
                  2519,
                  42,
                ],
              ],
            },
            "stack": [
              [
                "",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2526,
                15,
                2525,
                15,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2535,
                19,
                2534,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "end": 0,
              "env": "Server",
              "name": "thirdParty",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    2540,
                    40,
                    2519,
                    42,
                  ],
                ],
              },
              "stack": [
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2535,
                  25,
                  2534,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": "third-party hi",
              },
            },
            "env": "Server",
            "owner": {
              "env": "Server",
              "key": null,
              "name": "Component",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2540,
                  40,
                  2519,
                  42,
                ],
              ],
            },
            "stack": [
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2535,
                25,
                2534,
                5,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "time": 0,
          },
        ]
      `);
    }
  });
});
