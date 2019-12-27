/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */

// sanity tests for ReactNoop.act()

jest.useRealTimers();
const React = require('react');
const ReactNoop = require('react-noop-renderer');
const Scheduler = require('scheduler');

describe('ReactNoop.act()', () => {
  it('can use act to flush effects', async () => {
    function App(props) {
      React.useEffect(props.callback);
      return null;
    }

    let calledLog = [];
    ReactNoop.act(() => {
      ReactNoop.render(
        <App
          callback={() => {
            calledLog.push(calledLog.length);
          }}
        />,
      );
    });
    expect(Scheduler).toFlushWithoutYielding();
    expect(calledLog).toEqual([0]);
  });

  it('should work with async/await', async () => {
    function App() {
      let [ctr, setCtr] = React.useState(0);
      async function someAsyncFunction() {
        Scheduler.unstable_yieldValue('stage 1');
        await null;
        Scheduler.unstable_yieldValue('stage 2');
        await null;
        setCtr(1);
      }
      React.useEffect(() => {
        someAsyncFunction();
      }, []);
      return ctr;
    }
    await ReactNoop.act(async () => {
      ReactNoop.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['stage 1', 'stage 2']);
    expect(Scheduler).toFlushWithoutYielding();
    expect(ReactNoop.getChildren()).toEqual([{text: '1', hidden: false}]);
  });
});
