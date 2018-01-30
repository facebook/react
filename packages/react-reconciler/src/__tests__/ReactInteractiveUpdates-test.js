/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactNoop;

describe('ReactInteractiveUpdates', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  it('Example: Submit button that disables itself on submit', () => {
    let ops = [];

    function SubmitButton(props) {
      return (
        <span
          prop={{
            onClick() {
              if (props.disabled) {
                return;
              }
              // Submit the form
              ops.push('Submit form');
              // Update the button to disable it.
              ReactNoop.render(<SubmitButton disabled={true} />);
            },
          }}
        />
      );
    }

    function click() {
      ReactNoop.interactiveUpdates(() => {
        const children = ReactNoop.getChildren();
        const eventHandler = children[0].prop.onClick;
        eventHandler();
      });
    }

    // Initial mount
    ReactNoop.render(<SubmitButton disabled={false} />);
    ReactNoop.flush();

    // Click the button to submit the form
    click();
    expect(ops).toEqual(['Submit form']);

    ops = [];

    // The form should not submit again no matter how many times we
    // click it.
    click();
    click();
    click();
    click();
    click();
    expect(ops).toEqual([]);
  });

  it('Example: Button that toggles on and off', () => {
    function Input(props) {
      return (
        <span
          prop={{
            enabled: props.enabled,
            onToggle: () =>
              ReactNoop.render(<Input enabled={!props.enabled} />),
          }}
        />
      );
    }

    // Toggles the current state of the view.
    function toggle() {
      ReactNoop.interactiveUpdates(() => {
        const children = ReactNoop.getChildren();
        const eventHandler = children[0].prop.onToggle;
        eventHandler();
      });
    }

    // Reads the current, flushed state
    function isEnabled() {
      const children = ReactNoop.getChildren();
      return children[0].prop.enabled === true;
    }

    // Initial mount
    ReactNoop.render(<Input enabled={false} />);
    ReactNoop.flush();

    // Toggle the view
    toggle();
    // The update hasn't flushed yet because it's async
    expect(isEnabled()).toBe(false);

    // If we toggle again, then flush the remaining work, the final
    // state should be false, because the second toggle is based on
    // the state after the first one has processed.
    toggle();
    ReactNoop.flush();
    expect(isEnabled()).toBe(false);
  });
});
