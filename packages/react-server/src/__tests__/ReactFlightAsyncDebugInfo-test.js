/**
 * @jest-environment node
 */
'use strict';

import {patchSetImmediate} from '../../../../scripts/jest/patchSetImmediate';

import fs from 'fs/promises';
import path from 'path';

let React;
let ReactServer;
let cache;
let ReactServerDOMServer;
let ReactServerDOMClient;
let Stream;
let observer;
let getDebugInfo;

const streamOptions = {
  objectMode: true,
};

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

    getDebugInfo = require('internal-test-utils').getDebugInfo.bind(null, {
      ignoreProps: true,
      useFixedTime: true,
    });
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
      promise.displayName = 'hello';
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
                129,
                109,
                108,
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
                    129,
                    109,
                    108,
                    50,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  110,
                  13,
                  109,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  118,
                  26,
                  117,
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
                  129,
                  109,
                  108,
                  50,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                110,
                13,
                109,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                118,
                26,
                117,
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
              "name": "hello",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    129,
                    109,
                    108,
                    50,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  111,
                  21,
                  109,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  118,
                  20,
                  117,
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
                  129,
                  109,
                  108,
                  50,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                113,
                21,
                109,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                118,
                20,
                117,
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
                120,
                60,
                117,
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
              "name": "hello",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    129,
                    109,
                    108,
                    50,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  111,
                  21,
                  109,
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
                  120,
                  60,
                  117,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "InnerComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                126,
                35,
                123,
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
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
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
                589,
                40,
                570,
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
                    589,
                    40,
                    570,
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
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  572,
                  13,
                  571,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  577,
                  36,
                  576,
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
                  589,
                  40,
                  570,
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
                572,
                13,
                571,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                577,
                36,
                576,
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
                579,
                60,
                576,
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
                    589,
                    40,
                    570,
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
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  572,
                  13,
                  571,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  578,
                  22,
                  576,
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
                  579,
                  60,
                  576,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "InnerComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                585,
                40,
                582,
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
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
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
                896,
                109,
                883,
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
                    896,
                    109,
                    883,
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
                  896,
                  109,
                  883,
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
          {
            "awaited": {
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
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
                1010,
                109,
                1001,
                94,
              ],
            ],
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
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
                1095,
                109,
                1071,
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
          {
            "awaited": {
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
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
                1191,
                109,
                1174,
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
                93,
                40,
                91,
                3,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1187,
                24,
                1186,
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
                    93,
                    40,
                    91,
                    3,
                  ],
                  [
                    "Component",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1187,
                    24,
                    1186,
                    5,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1176,
                  13,
                  1175,
                  5,
                ],
                [
                  "ThirdPartyComponent",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1182,
                  24,
                  1181,
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
                  93,
                  40,
                  91,
                  3,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1187,
                  24,
                  1186,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1176,
                13,
                1175,
                5,
              ],
              [
                "ThirdPartyComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1182,
                24,
                1181,
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
                    93,
                    40,
                    91,
                    3,
                  ],
                  [
                    "Component",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    1187,
                    24,
                    1186,
                    5,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1177,
                  13,
                  1175,
                  5,
                ],
                [
                  "ThirdPartyComponent",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1182,
                  18,
                  1181,
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
                  93,
                  40,
                  91,
                  3,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1187,
                  24,
                  1186,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1177,
                13,
                1175,
                5,
              ],
              [
                "ThirdPartyComponent",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1182,
                18,
                1181,
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
              "byteSize": 0,
              "end": 0,
              "env": "Server",
              "name": "RSC stream",
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
            "env": "Server",
          },
          {
            "time": 0,
          },
          {
            "awaited": {
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
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
                1532,
                40,
                1515,
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
                    1532,
                    40,
                    1515,
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
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1517,
                  13,
                  1516,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1527,
                  13,
                  1526,
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
                  1532,
                  40,
                  1515,
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
                1517,
                13,
                1516,
                25,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1527,
                13,
                1526,
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
                1528,
                60,
                1526,
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
                    1532,
                    40,
                    1515,
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
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1517,
                  13,
                  1516,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1527,
                  13,
                  1526,
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
                  1528,
                  60,
                  1526,
                  5,
                ],
              ],
            },
            "stack": [
              [
                "Child",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1522,
                28,
                1521,
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
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
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
                1845,
                40,
                1829,
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
                    1845,
                    40,
                    1829,
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
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1831,
                  13,
                  1830,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1840,
                  23,
                  1839,
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
                  1845,
                  40,
                  1829,
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
                1831,
                13,
                1830,
                25,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                1840,
                23,
                1839,
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
                1841,
                60,
                1839,
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
                    1845,
                    40,
                    1829,
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
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1831,
                  13,
                  1830,
                  25,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  1840,
                  23,
                  1839,
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
                1841,
                60,
                1839,
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
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
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
                2141,
                40,
                2123,
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
                    2141,
                    40,
                    2123,
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
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "delayTrice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2131,
                  13,
                  2129,
                  5,
                ],
                [
                  "Bar",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2136,
                  13,
                  2135,
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
                  2141,
                  40,
                  2123,
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
                2131,
                13,
                2129,
                5,
              ],
              [
                "Bar",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2136,
                13,
                2135,
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
                    2141,
                    40,
                    2123,
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
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "delayTwice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2125,
                  13,
                  2124,
                  5,
                ],
                [
                  "delayTrice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2130,
                  15,
                  2129,
                  5,
                ],
                [
                  "Bar",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2136,
                  13,
                  2135,
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
                  2141,
                  40,
                  2123,
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
                2125,
                13,
                2124,
                5,
              ],
              [
                "delayTrice",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2130,
                15,
                2129,
                5,
              ],
              [
                "Bar",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2136,
                13,
                2135,
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
                    2141,
                    40,
                    2123,
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
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "delayTwice",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2126,
                  13,
                  2124,
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
                  2141,
                  40,
                  2123,
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
                2126,
                13,
                2124,
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
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
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
                2550,
                109,
                2539,
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
                    2550,
                    109,
                    2539,
                    58,
                  ],
                ],
              },
              "stack": [
                [
                  "delay",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "getData",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2541,
                  14,
                  2540,
                  5,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2547,
                  20,
                  2546,
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
                  2550,
                  109,
                  2539,
                  58,
                ],
              ],
            },
            "stack": [
              [
                "getData",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2541,
                23,
                2540,
                5,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2547,
                20,
                2546,
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
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
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
                2717,
                40,
                2705,
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
                    2717,
                    40,
                    2705,
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
                  86,
                  12,
                  85,
                  3,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2713,
                  20,
                  2712,
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
                  2717,
                  40,
                  2705,
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
                2713,
                20,
                2712,
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
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
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
                2906,
                40,
                2885,
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
                    2906,
                    40,
                    2885,
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
                  2892,
                  15,
                  2891,
                  15,
                ],
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  2901,
                  19,
                  2900,
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
                  2906,
                  40,
                  2885,
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
                2892,
                15,
                2891,
                15,
              ],
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                2901,
                19,
                2900,
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
                    2906,
                    40,
                    2885,
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
                  2901,
                  25,
                  2900,
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
                  2906,
                  40,
                  2885,
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
                2901,
                25,
                2900,
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
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
          },
        ]
      `);
    }
  });

  it('can track async file reads', async () => {
    const filename = path.join(__dirname, 'test-file.txt');
    async function Component() {
      const buffer = await fs
        .readFile(filename) // This loads a Buffer.
        // TODO: For some reason, without this we're extracting the wrong promise.
        .then(v => v);
      const text = buffer.toString('utf8');
      return text.slice(0, 26);
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(
      <Component />,
      {},
    );

    const readable = new Stream.PassThrough(streamOptions);

    const result = ReactServerDOMClient.createFromNodeStream(readable, {
      moduleMap: {},
      moduleLoading: {},
    });
    stream.pipe(readable);

    expect(await result).toBe('Lorem ipsum dolor sit amet');

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
                3182,
                40,
                3170,
                36,
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
              "name": "Object.readFile",
              "owner": {
                "env": "Server",
                "key": null,
                "name": "Component",
                "props": {},
                "stack": [
                  [
                    "Object.<anonymous>",
                    "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                    3182,
                    40,
                    3170,
                    36,
                  ],
                ],
              },
              "stack": [
                [
                  "Component",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  3174,
                  7,
                  3172,
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
              "name": "Component",
              "props": {},
              "stack": [
                [
                  "Object.<anonymous>",
                  "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                  3182,
                  40,
                  3170,
                  36,
                ],
              ],
            },
            "stack": [
              [
                "Component",
                "/packages/react-server/src/__tests__/ReactFlightAsyncDebugInfo-test.js",
                3176,
                7,
                3172,
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
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
          },
        ]
      `);
    }
  });

  it('can track a promise created fully outside first party code', async function internal_test() {
    async function internal_API(text, timeout) {
      let resolve;
      const promise = new Promise(r => {
        resolve = r;
      });
      promise.displayName = 'greeting';
      setTimeout(() => resolve(text), timeout);
      return promise;
    }

    async function Component({promise}) {
      const result = await promise;
      return result;
    }

    const stream = ReactServerDOMServer.renderToPipeableStream(
      <Component promise={internal_API('hello', 1)} />,
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

    expect(await result).toBe('hello');

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
              "name": "greeting",
              "start": 0,
              "value": {
                "status": "halted",
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
                3327,
                20,
                3326,
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
              "byteSize": 0,
              "end": 0,
              "name": "RSC stream",
              "owner": null,
              "start": 0,
              "value": {
                "value": "stream",
              },
            },
          },
        ]
      `);
    }
  });
});
