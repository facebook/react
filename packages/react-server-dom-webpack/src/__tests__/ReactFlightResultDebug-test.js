/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactNoop;
let ReactNoopFlightServer;
let ReactNoopFlightClient;
let act;

describe('ReactFlightResult component history', () => {
  beforeEach(() => {
    let time = 10;
    jest.spyOn(performance, 'timeOrigin', 'get').mockReturnValue(time);
    jest.spyOn(performance, 'now').mockImplementation(() => time++);
    jest.resetModules();
    jest.mock('react', () => require('react/react.react-server'));
    ReactNoopFlightServer = require('react-noop-renderer/flight-server');
    const flightModules = require('react-noop-renderer/flight-modules');
    jest.resetModules();
    __unmockReact();
    jest.mock('react-noop-renderer/flight-modules', () => flightModules);
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    ReactNoopFlightClient = require('react-noop-renderer/flight-client');
    act = require('internal-test-utils').act;
  });

  // @gate __DEV__ && enableComponentPerformanceTrack
  it.skip('can render deep but cut off Map/Set in debug info', async () => {
    function createDeepMap(n) {
      if (n <= 0) {
        return null;
      }
      const map = new Map();
      map.set('key', createDeepMap(n - 1));
      return map;
    }

    function createDeepSet(n) {
      if (n <= 0) {
        return null;
      }
      const set = new Set();
      set.add(createDeepSet(n - 1));
      return set;
    }

    function ServerComponent(props) {
      return <div>not using props</div>;
    }

    const transport = ReactNoopFlightServer.render({
      set: (
        <ServerComponent
          set={createDeepSet(100) /* deper than objectLimit */}
        />
      ),
      map: (
        <ServerComponent
          map={createDeepMap(100) /* deper than objectLimit */}
        />
      ),
    });

    await act(async () => {
      const rootModel = await ReactNoopFlightClient.read(transport);
      const set = rootModel.set._debugInfo[1].props.set;
      const map = rootModel.map._debugInfo[1].props.map;
      expect(set instanceof Set).toBe(true);
      expect(set.size).toBe(1);
      // eslint-disable-next-line no-for-of-loops/no-for-of-loops
      for (const entry of set) {
        expect(entry instanceof Set).toBe(true);
        break;
      }

      expect(map instanceof Map).toBe(true);
      expect(map.size).toBe(1);
      expect(map.get('key') instanceof Map).toBe(true);

      ReactNoop.render(rootModel.set);
    });

    expect(ReactNoop).toMatchRenderedOutput(<div>not using props</div>);
  });
});
