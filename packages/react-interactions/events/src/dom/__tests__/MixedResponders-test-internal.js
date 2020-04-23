/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import {createEventTarget} from 'dom-event-testing-library';

let React;
let ReactFeatureFlags;
let ReactDOM;
let Scheduler;

describe('mixing responders with the heritage event system', () => {
  let container;

  beforeEach(() => {
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableDeprecatedFlareAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  // @gate experimental
  it('should properly only flush sync once when the event systems are mixed', () => {
    const useTap = require('react-interactions/events/tap').useTap;
    const ref = React.createRef();
    let renderCounts = 0;

    function MyComponent() {
      const [, updateCounter] = React.useState(0);
      renderCounts++;

      function handleTap() {
        updateCounter(count => count + 1);
      }

      const listener = useTap({
        onTapEnd: handleTap,
      });

      return (
        <div>
          <button
            ref={ref}
            DEPRECATED_flareListeners={listener}
            onClick={() => {
              updateCounter(count => count + 1);
            }}>
            Press me
          </button>
        </div>
      );
    }

    const newContainer = document.createElement('div');
    const root = ReactDOM.createRoot(newContainer);
    document.body.appendChild(newContainer);
    root.render(<MyComponent />);
    Scheduler.unstable_flushAll();

    const target = createEventTarget(ref.current);
    target.pointerdown({timeStamp: 100});
    target.pointerup({timeStamp: 100});
    target.click({timeStamp: 100});

    if (__DEV__) {
      expect(renderCounts).toBe(2);
    } else {
      expect(renderCounts).toBe(1);
    }
    Scheduler.unstable_flushAll();
    if (__DEV__) {
      expect(renderCounts).toBe(4);
    } else {
      expect(renderCounts).toBe(2);
    }

    target.pointerdown({timeStamp: 100});
    target.pointerup({timeStamp: 100});
    // Ensure the timeStamp logic works
    target.click({timeStamp: 101});

    if (__DEV__) {
      expect(renderCounts).toBe(6);
    } else {
      expect(renderCounts).toBe(3);
    }

    Scheduler.unstable_flushAll();
    document.body.removeChild(newContainer);
  });

  // @gate experimental
  it(
    'should only flush before outermost discrete event handler when mixing ' +
      'event systems',
    async () => {
      const {useState} = React;
      const useTap = require('react-interactions/events/tap').useTap;

      const button = React.createRef();

      function MyComponent() {
        const [pressesCount, updatePressesCount] = useState(0);
        const [clicksCount, updateClicksCount] = useState(0);

        function handleTap() {
          // This dispatches a synchronous, discrete event in the legacy event
          // system. However, because it's nested inside the new event system,
          // its updates should not flush until the end of the outer handler.
          const target = createEventTarget(button.current);
          target.click();
          // Text context should not have changed
          Scheduler.unstable_yieldValue(newContainer.textContent);
          updatePressesCount(pressesCount + 1);
        }

        const tap = useTap({
          onTapEnd: handleTap,
        });

        return (
          <div>
            <button
              DEPRECATED_flareListeners={tap}
              ref={button}
              onClick={() => updateClicksCount(clicksCount + 1)}>
              Presses: {pressesCount}, Clicks: {clicksCount}
            </button>
          </div>
        );
      }

      const newContainer = document.createElement('div');
      document.body.appendChild(newContainer);
      const root = ReactDOM.createRoot(newContainer);

      root.render(<MyComponent />);
      expect(Scheduler).toFlushWithoutYielding();
      expect(newContainer.textContent).toEqual('Presses: 0, Clicks: 0');

      const target = createEventTarget(button.current);
      target.pointerdown({timeStamp: 100});
      target.pointerup({timeStamp: 100});

      expect(Scheduler).toHaveYielded(['Presses: 0, Clicks: 0']);
      expect(Scheduler).toFlushWithoutYielding();
      expect(newContainer.textContent).toEqual('Presses: 1, Clicks: 1');
    },
  );

  describe('mixing the Input and Press repsonders', () => {
    // @gate experimental
    it('is async for non-input events', () => {
      const useTap = require('react-interactions/events/tap').useTap;
      const useInput = require('react-interactions/events/input').useInput;
      const root = ReactDOM.createRoot(container);
      let input;

      function Component({innerRef, onChange, controlledValue, listeners}) {
        const inputListener = useInput({onChange});
        return (
          <input
            type="text"
            ref={innerRef}
            value={controlledValue}
            DEPRECATED_flareListeners={[inputListener, listeners]}
          />
        );
      }

      function PressWrapper({innerRef, onTap, onChange, controlledValue}) {
        const tap = useTap({
          onTapEnd: onTap,
        });
        return (
          <Component
            onChange={onChange}
            innerRef={el => (input = el)}
            controlledValue={controlledValue}
            listeners={tap}
          />
        );
      }

      class ControlledInput extends React.Component {
        state = {value: 'initial'};
        onChange = event => this.setState({value: event.target.value});
        reset = () => {
          this.setState({value: ''});
        };
        render() {
          Scheduler.unstable_yieldValue(`render: ${this.state.value}`);
          const controlledValue =
            this.state.value === 'changed' ? 'changed [!]' : this.state.value;
          return (
            <PressWrapper
              onTap={this.reset}
              onChange={this.onChange}
              innerRef={el => (input = el)}
              controlledValue={controlledValue}
            />
          );
        }
      }

      // Initial mount. Test that this is async.
      root.render(<ControlledInput />);
      // Should not have flushed yet.
      expect(Scheduler).toHaveYielded([]);
      expect(input).toBe(undefined);
      // Flush callbacks.
      expect(Scheduler).toFlushAndYield(['render: initial']);
      expect(input.value).toBe('initial');

      // Trigger a click event
      input.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          buttons: 1,
        }),
      );
      input.dispatchEvent(
        new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          buttons: 0,
        }),
      );
      // Nothing should have changed
      expect(Scheduler).toHaveYielded([]);
      expect(input.value).toBe('initial');

      // Flush callbacks.
      // Now the click update has flushed.
      expect(Scheduler).toFlushAndYield(['render: ']);
      expect(input.value).toBe('');
    });
  });
});
