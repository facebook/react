/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactNoop;

describe('ReactDeterministicUpdates', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('ReactNoopEntry');
  });

  const HIGH_PRI_UPDATE = 'HIGH_PRI_UPDATE';
  const LOW_PRI_UPDATE = 'LOW_PRI_UPDATE';
  const EXPIRE = 'EXPIRE';

  const genAction = gen.oneOf([
    {type: HIGH_PRI_UPDATE},
    {type: LOW_PRI_UPDATE},
    gen.object({type: EXPIRE, payload: gen.intWithin(0, 50)}),
  ]);

  check.it(
    'terminal value is the same regardless of priority',
    {times: 20},
    gen.array(genAction, {size: 5}),
    (actions, id) => {
      class Log extends React.Component {
        state = {log: []};
        render() {
          return null;
        }
      }

      let instance;
      const root = ReactNoop.createRoot();
      root.render(<Log ref={inst => (instance = inst)} />);
      ReactNoop.flush();

      // Schedule updates at different priorities. Assert that they are
      // processed in insertion order.
      function updateLog(value) {
        // Append value to the log. The log represents the order in which
        // updates were processed.
        return state => ({log: [...state.log, value]});
      }

      function checkLog(log) {
        let previous;
        for (let i = 0; i < log.length; i++) {
          const current = log[i];
          if (typeof current !== 'number') {
            throw new Error('Expected a number.');
          }
          if (previous !== undefined) {
            if (current < previous) {
              throw new Error('Updates were flushed out of order');
            }
          }
          previous = current;
        }
      }

      try {
        var updateCounter = 0;
        var expectedTerminalLog = [];
        for (var i = 0; i < actions.length; i++) {
          var action = actions[i];
          ReactNoop.flushSync(() => {
            switch (action.type) {
              case HIGH_PRI_UPDATE:
                instance.setState(updateLog(++updateCounter));
                expectedTerminalLog.push(updateCounter);
                break;
              case LOW_PRI_UPDATE:
                ReactNoop.deferredUpdates(() => {
                  instance.setState(updateLog(++updateCounter));
                });
                expectedTerminalLog.push(updateCounter);
                break;
              case EXPIRE:
                ReactNoop.expire(action.payload);
                break;
              default:
                throw new Error('Switch statement should be exhaustive.');
            }
          });
          checkLog(instance.state.log);
        }
        ReactNoop.flush();
        // The final state is deterministic
        expect(instance.state.log).toEqual(expectedTerminalLog);
      } finally {
        root.unmount();
        ReactNoop.flush();
      }
    },
  );
});
