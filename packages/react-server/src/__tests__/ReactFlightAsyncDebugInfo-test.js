/**
 * @jest-environment node
 */
'use strict';

const path = require('path');

import {patchSetImmediate} from '../../../../scripts/jest/patchSetImmediate';

let React;
let ReactServer;
let cache;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Stream;
let observer;

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

function normalizeDebugInfo(original) {
  const {debugTask, debugStack, debugLocation, ...debugInfo} = original;
  if (debugInfo.owner) {
    debugInfo.owner = normalizeDebugInfo(debugInfo.owner);
  }
  if (debugInfo.awaited) {
    debugInfo.awaited = normalizeIOInfo(debugInfo.awaited);
  }
  if (debugInfo.props) {
    debugInfo.props = {};
  }
  if (Array.isArray(debugInfo.stack)) {
    debugInfo.stack = normalizeStack(debugInfo.stack);
    return debugInfo;
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

  afterEach(() => {
    observer?.disconnect();
    observer = undefined;
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
                211,
                109,
                191,
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
                    211,
                    109,
                    191,
                    50,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  193,
                  13,
                  192,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  200,
                  26,
                  199,
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
                  211,
                  109,
                  191,
                  50,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                193,
                13,
                192,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                200,
                26,
                199,
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
                    211,
                    109,
                    191,
                    50,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  194,
                  21,
                  192,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  200,
                  20,
                  199,
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
                  211,
                  109,
                  191,
                  50,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                195,
                21,
                192,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                200,
                20,
                199,
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
                202,
                60,
                199,
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
                    211,
                    109,
                    191,
                    50,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  194,
                  21,
                  192,
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
                  202,
                  60,
                  199,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "InnerComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                208,
                35,
                205,
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

  it('adds a description to I/O', async () => {
    async function getData(url) {
      // just wait a macrotask for this call to get picked up
      await new Promise(resolve => {
        setTimeout(() => {
          const fakeResponse = {url};
          resolve(fakeResponse);
        }, 1);
      });
    }

    async function Component() {
      await getData('http://github.com/facebook/react/pulls');
      await getData('http://github.com/facebook/react/pulls/');
      await getData(
        'https://this-is-a-very-long-domain-name-what-happens.app/test',
      );
      await getData(
        'https://github.com/facebook/react/commit/75897c2dcd1dd3a6ca46284dd37e13d22b4b16b4',
      );
      await getData('/this-is-a-very-long-directory-name-what-happens/');
      await getData('/this-is-not');
      return 'Hi, Sebbie';
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(<Component />);

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(
      readable,
      {
        moduleMap: {},
        moduleLoading: {},
      },
      {replayConsoleLogs: true},
    );
    stream.pipe(readable);

    expect(await result).toBe('Hi, Sebbie');

    if (
      __DEV__ &&
      gate(
        flags =>
          flags.enableComponentPerformanceTrack && flags.enableAsyncDebugInfo,
      )
    ) {
      let gotEntries;
      const hasEntries = new Promise(resolve => {
        gotEntries = resolve;
      });
      const entries = [];
      observer = new PerformanceObserver(list => {
        // eslint-disable-next-line no-for-of-loops/no-for-of-loops
        for (const entry of list.getEntries()) {
          const {name} = entry;
          entries.push({name});
        }
        gotEntries();
      }).observe({type: 'measure'});

      await hasEntries;
      await finishLoadingStream(readable);

      expect(entries).toMatchInlineSnapshot(`
        [
          {
            "name": "\u200bComponent",
          },
          {
            "name": "await getData (…/pulls)",
          },
          {
            "name": "await getData (…/pulls)",
          },
          {
            "name": "await getData (…/test)",
          },
          {
            "name": "await getData (…/75897c2dcd…13d22b4b16b4)",
          },
          {
            "name": "await getData (/this-is-a-…what-happens)",
          },
          {
            "name": "await getData (/this-is-not)",
          },
        ]
      `);
    } else {
      await finishLoadingStream(readable);
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
                659,
                40,
                640,
                49,
              ],
              [
                "new Promise",
                "",
                0,
                0,
                0,
                0,
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
                    659,
                    40,
                    640,
                    49,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  642,
                  13,
                  641,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  647,
                  36,
                  646,
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
                  659,
                  40,
                  640,
                  49,
                ],
                [
                  "new Promise",
                  "",
                  0,
                  0,
                  0,
                  0,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                642,
                13,
                641,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                647,
                36,
                646,
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
                649,
                60,
                646,
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
                    659,
                    40,
                    640,
                    49,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  642,
                  13,
                  641,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  648,
                  22,
                  646,
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
                  649,
                  60,
                  646,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "InnerComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                655,
                40,
                652,
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
                954,
                109,
                941,
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
                    954,
                    109,
                    941,
                    80,
                  ],
                ],
              },
              "start": 0,
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
                  954,
                  109,
                  941,
                  80,
                ],
              ],
            },
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
                1056,
                109,
                1047,
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
                1129,
                109,
                1105,
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
                1213,
                109,
                1196,
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
                176,
                40,
                174,
                3,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1209,
                24,
                1208,
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
                    176,
                    40,
                    174,
                    3,
                  ],
                  [
                    "Component",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1209,
                    24,
                    1208,
                    5,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1198,
                  13,
                  1197,
                  5,
                ],
                [
                  "ThirdPartyComponent",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1204,
                  24,
                  1203,
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
                  176,
                  40,
                  174,
                  3,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1209,
                  24,
                  1208,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1198,
                13,
                1197,
                5,
              ],
              [
                "ThirdPartyComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1204,
                24,
                1203,
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
                    176,
                    40,
                    174,
                    3,
                  ],
                  [
                    "Component",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1209,
                    24,
                    1208,
                    5,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1199,
                  13,
                  1197,
                  5,
                ],
                [
                  "ThirdPartyComponent",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1204,
                  18,
                  1203,
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
                  176,
                  40,
                  174,
                  3,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1209,
                  24,
                  1208,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1199,
                13,
                1197,
                5,
              ],
              [
                "ThirdPartyComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1204,
                18,
                1203,
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
                1529,
                40,
                1512,
                62,
              ],
              [
                "new Promise",
                "",
                0,
                0,
                0,
                0,
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
                    1529,
                    40,
                    1512,
                    62,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1514,
                  13,
                  1513,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1524,
                  13,
                  1523,
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
                  1529,
                  40,
                  1512,
                  62,
                ],
                [
                  "new Promise",
                  "",
                  0,
                  0,
                  0,
                  0,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1514,
                13,
                1513,
                25,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1524,
                13,
                1523,
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
                1525,
                60,
                1523,
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
                    1529,
                    40,
                    1512,
                    62,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1514,
                  13,
                  1513,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1524,
                  13,
                  1523,
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
                  1525,
                  60,
                  1523,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "Child",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1519,
                28,
                1518,
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
                1830,
                40,
                1814,
                57,
              ],
              [
                "new Promise",
                "",
                0,
                0,
                0,
                0,
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
                    1830,
                    40,
                    1814,
                    57,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1816,
                  13,
                  1815,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1825,
                  23,
                  1824,
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
                  1830,
                  40,
                  1814,
                  57,
                ],
                [
                  "new Promise",
                  "",
                  0,
                  0,
                  0,
                  0,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1816,
                13,
                1815,
                25,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1825,
                23,
                1824,
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
                1826,
                60,
                1824,
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
                    1830,
                    40,
                    1814,
                    57,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1816,
                  13,
                  1815,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1825,
                  23,
                  1824,
                  5,
                ],
              ],
              "start": 0,
              "value": {
                "value": undefined,
              },
            },
            "env": "Server",
            "stack": [
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1826,
                60,
                1824,
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
                2114,
                40,
                2096,
                80,
              ],
              [
                "new Promise",
                "",
                0,
                0,
                0,
                0,
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
                    2114,
                    40,
                    2096,
                    80,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "delayTrice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2104,
                  13,
                  2102,
                  5,
                ],
                [
                  "Bar",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2109,
                  13,
                  2108,
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
                  2114,
                  40,
                  2096,
                  80,
                ],
                [
                  "new Promise",
                  "",
                  0,
                  0,
                  0,
                  0,
                ],
              ],
            },
            "stack": [
              [
                "delayTrice",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2104,
                13,
                2102,
                5,
              ],
              [
                "Bar",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2109,
                13,
                2108,
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
                    2114,
                    40,
                    2096,
                    80,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "delayTwice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2098,
                  13,
                  2097,
                  5,
                ],
                [
                  "delayTrice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2103,
                  15,
                  2102,
                  5,
                ],
                [
                  "Bar",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2109,
                  13,
                  2108,
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
                  2114,
                  40,
                  2096,
                  80,
                ],
                [
                  "new Promise",
                  "",
                  0,
                  0,
                  0,
                  0,
                ],
              ],
            },
            "stack": [
              [
                "delayTwice",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2098,
                13,
                2097,
                5,
              ],
              [
                "delayTrice",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2103,
                15,
                2102,
                5,
              ],
              [
                "Bar",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2109,
                13,
                2108,
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
                    2114,
                    40,
                    2096,
                    80,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "delayTwice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2099,
                  13,
                  2097,
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
                  2114,
                  40,
                  2096,
                  80,
                ],
                [
                  "new Promise",
                  "",
                  0,
                  0,
                  0,
                  0,
                ],
              ],
            },
            "stack": [
              [
                "delayTwice",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2099,
                13,
                2097,
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
                2511,
                109,
                2500,
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
                    2511,
                    109,
                    2500,
                    58,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2502,
                  14,
                  2501,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2508,
                  20,
                  2507,
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
                  2511,
                  109,
                  2500,
                  58,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2502,
                23,
                2501,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2508,
                20,
                2507,
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
                2666,
                40,
                2654,
                56,
              ],
              [
                "new Promise",
                "",
                0,
                0,
                0,
                0,
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
                    2666,
                    40,
                    2654,
                    56,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  169,
                  12,
                  168,
                  3,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2662,
                  20,
                  2661,
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
                  2666,
                  40,
                  2654,
                  56,
                ],
                [
                  "new Promise",
                  "",
                  0,
                  0,
                  0,
                  0,
                ],
              ],
            },
            "stack": [
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2662,
                20,
                2661,
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
                2843,
                40,
                2822,
                42,
              ],
              [
                "new Promise",
                "",
                0,
                0,
                0,
                0,
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
                    2843,
                    40,
                    2822,
                    42,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2829,
                  15,
                  2828,
                  15,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2838,
                  19,
                  2837,
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
                  2843,
                  40,
                  2822,
                  42,
                ],
                [
                  "new Promise",
                  "",
                  0,
                  0,
                  0,
                  0,
                ],
              ],
            },
            "stack": [
              [
                "",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2829,
                15,
                2828,
                15,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2838,
                19,
                2837,
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
                    2843,
                    40,
                    2822,
                    42,
                  ],
                  [
                    "new Promise",
                    "",
                    0,
                    0,
                    0,
                    0,
                  ],
                ],
              },
              "stack": [
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2838,
                  25,
                  2837,
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
                  2843,
                  40,
                  2822,
                  42,
                ],
                [
                  "new Promise",
                  "",
                  0,
                  0,
                  0,
                  0,
                ],
              ],
            },
            "stack": [
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2838,
                25,
                2837,
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
