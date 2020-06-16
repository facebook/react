/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

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
