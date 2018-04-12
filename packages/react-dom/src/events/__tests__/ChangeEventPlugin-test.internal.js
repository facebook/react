/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
let ReactDOM = require('react-dom');
let ReactFeatureFlags;

const setUntrackedChecked = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'checked',
).set;

const setUntrackedValue = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
).set;

const setUntrackedTextareaValue = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype,
  'value',
).set;

describe('ChangeEventPlugin', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  // We try to avoid firing "duplicate" React change events.
  // However, to tell which events are "duplicates" and should be ignored,
  // we are tracking the "current" input value, and only respect events
  // that occur after it changes. In most of these tests, we verify that we
  // keep track of the "current" value and only fire events when it changes.
  // See https://github.com/facebook/react/pull/5746.

  it('should consider initial text value to be current', () => {
    let called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    const node = ReactDOM.render(
      <input type="text" onChange={cb} defaultValue="foo" />,
      container,
    );
    node.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    node.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));
    // There should be no React change events because the value stayed the same.
    expect(called).toBe(0);
  });

  it('should consider initial checkbox checked=true to be current', () => {
    let called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    const node = ReactDOM.render(
      <input type="checkbox" onChange={cb} defaultChecked={true} />,
      container,
    );

    // Secretly, set `checked` to false, so that dispatching the `click` will
    // make it `true` again. Thus, at the time of the event, React should not
    // consider it a change from the initial `true` value.
    setUntrackedChecked.call(node, false);
    node.dispatchEvent(
      new MouseEvent('click', {bubbles: true, cancelable: true}),
    );
    // There should be no React change events because the value stayed the same.
    expect(called).toBe(0);
  });

  it('should consider initial checkbox checked=false to be current', () => {
    let called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    const node = ReactDOM.render(
      <input type="checkbox" onChange={cb} defaultChecked={false} />,
      container,
    );

    // Secretly, set `checked` to true, so that dispatching the `click` will
    // make it `false` again. Thus, at the time of the event, React should not
    // consider it a change from the initial `false` value.
    setUntrackedChecked.call(node, true);
    node.dispatchEvent(
      new MouseEvent('click', {bubbles: true, cancelable: true}),
    );
    // There should be no React change events because the value stayed the same.
    expect(called).toBe(0);
  });

  it('should fire change for checkbox input', () => {
    let called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    const node = ReactDOM.render(
      <input type="checkbox" onChange={cb} />,
      container,
    );

    expect(node.checked).toBe(false);
    node.dispatchEvent(
      new MouseEvent('click', {bubbles: true, cancelable: true}),
    );
    // Note: unlike with text input events, dispatching `click` actually
    // toggles the checkbox and updates its `checked` value.
    expect(node.checked).toBe(true);
    expect(called).toBe(1);

    expect(node.checked).toBe(true);
    node.dispatchEvent(
      new MouseEvent('click', {bubbles: true, cancelable: true}),
    );
    expect(node.checked).toBe(false);
    expect(called).toBe(2);
  });

  it('should not fire change setting the value programmatically', () => {
    let called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    const input = ReactDOM.render(
      <input type="text" defaultValue="foo" onChange={cb} />,
      container,
    );

    // Set it programmatically.
    input.value = 'bar';
    // Even if a DOM input event fires, React sees that the real input value now
    // ('bar') is the same as the "current" one we already recorded.
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    expect(input.value).toBe('bar');
    // In this case we don't expect to get a React event.
    expect(called).toBe(0);

    // However, we can simulate user typing by calling the underlying setter.
    setUntrackedValue.call(input, 'foo');
    // Now, when the event fires, the real input value ('foo') differs from the
    // "current" one we previously recorded ('bar').
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    expect(input.value).toBe('foo');
    // In this case React should fire an event for it.
    expect(called).toBe(1);

    // Verify again that extra events without real changes are ignored.
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    expect(called).toBe(1);
  });

  it('should not distinguish equal string and number values', () => {
    let called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    const input = ReactDOM.render(
      <input type="text" defaultValue="42" onChange={cb} />,
      container,
    );

    // When we set `value` as a property, React updates the "current" value
    // that it tracks internally. The "current" value is later used to determine
    // whether a change event is a duplicate or not.
    // Even though we set value to a number, we still shouldn't get a change
    // event because as a string, it's equal to the initial value ('42').
    input.value = 42;
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    expect(input.value).toBe('42');
    expect(called).toBe(0);
  });

  // See a similar input test above for a detailed description of why.
  it('should not fire change when setting checked programmatically', () => {
    let called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    const input = ReactDOM.render(
      <input type="checkbox" onChange={cb} defaultChecked={false} />,
      container,
    );

    // Set the value, updating the "current" value that React tracks to true.
    input.checked = true;
    // Under the hood, uncheck the box so that the click will "check" it again.
    setUntrackedChecked.call(input, false);
    input.dispatchEvent(
      new MouseEvent('click', {bubbles: true, cancelable: true}),
    );
    expect(input.checked).toBe(true);
    // We don't expect a React event because at the time of the click, the real
    // checked value (true) was the same as the last recorded "current" value
    // (also true).
    expect(called).toBe(0);

    // However, simulating a normal click should fire a React event because the
    // real value (false) would have changed from the last tracked value (true).
    input.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));
    expect(called).toBe(1);
  });

  it('should unmount', () => {
    const input = ReactDOM.render(<input />, container);

    ReactDOM.unmountComponentAtNode(container);
  });

  it('should only fire change for checked radio button once', () => {
    let called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    const input = ReactDOM.render(
      <input type="radio" onChange={cb} />,
      container,
    );

    setUntrackedChecked.call(input, true);
    input.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));
    input.dispatchEvent(new Event('click', {bubbles: true, cancelable: true}));
    expect(called).toBe(1);
  });

  it('should track radio button cousins in a group', () => {
    let called1 = 0;
    let called2 = 0;

    function cb1(e) {
      called1++;
      expect(e.type).toBe('change');
    }

    function cb2(e) {
      called2++;
      expect(e.type).toBe('change');
    }

    const div = ReactDOM.render(
      <div>
        <input type="radio" name="group" onChange={cb1} />
        <input type="radio" name="group" onChange={cb2} />
      </div>,
      container,
    );
    const option1 = div.childNodes[0];
    const option2 = div.childNodes[1];

    // Select first option.
    option1.dispatchEvent(
      new Event('click', {bubbles: true, cancelable: true}),
    );
    expect(called1).toBe(1);
    expect(called2).toBe(0);

    // Select second option.
    option2.dispatchEvent(
      new Event('click', {bubbles: true, cancelable: true}),
    );
    expect(called1).toBe(1);
    expect(called2).toBe(1);

    // Select the first option.
    // It should receive the React change event again.
    option1.dispatchEvent(
      new Event('click', {bubbles: true, cancelable: true}),
    );
    expect(called1).toBe(2);
    expect(called2).toBe(1);
  });

  it('should deduplicate input value change events', () => {
    let called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    let input;
    ['text', 'number', 'range'].forEach(type => {
      called = 0;
      input = ReactDOM.render(<input type={type} onChange={cb} />, container);
      // Should be ignored (no change):
      input.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );
      setUntrackedValue.call(input, '42');
      input.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );
      // Should be ignored (no change):
      input.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );
      expect(called).toBe(1);
      ReactDOM.unmountComponentAtNode(container);

      called = 0;
      input = ReactDOM.render(<input type={type} onChange={cb} />, container);
      // Should be ignored (no change):
      input.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      setUntrackedValue.call(input, '42');
      input.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      // Should be ignored (no change):
      input.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      expect(called).toBe(1);
      ReactDOM.unmountComponentAtNode(container);

      called = 0;
      input = ReactDOM.render(<input type={type} onChange={cb} />, container);
      // Should be ignored (no change):
      input.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );
      setUntrackedValue.call(input, '42');
      input.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      // Should be ignored (no change):
      input.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );
      expect(called).toBe(1);
      ReactDOM.unmountComponentAtNode(container);
    });
  });

  it('should listen for both change and input events when supported', () => {
    let called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    const input = ReactDOM.render(
      <input type="range" onChange={cb} />,
      container,
    );

    setUntrackedValue.call(input, 10);
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));

    setUntrackedValue.call(input, 20);
    input.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));

    expect(called).toBe(2);
  });

  it('should only fire events when the value changes for range inputs', () => {
    let called = 0;

    function cb(e) {
      called++;
      expect(e.type).toBe('change');
    }

    const input = ReactDOM.render(
      <input type="range" onChange={cb} />,
      container,
    );
    setUntrackedValue.call(input, '40');
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    input.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));

    setUntrackedValue.call(input, 'foo');
    input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    input.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));

    expect(called).toBe(2);
  });

  it('does not crash for nodes with custom value property', () => {
    let originalCreateElement;
    // https://github.com/facebook/react/issues/10196
    try {
      originalCreateElement = document.createElement;
      document.createElement = function() {
        const node = originalCreateElement.apply(this, arguments);
        Object.defineProperty(node, 'value', {
          get() {},
          set() {},
        });
        return node;
      };
      const div = document.createElement('div');
      // Mount
      const node = ReactDOM.render(<input type="text" />, div);
      // Update
      ReactDOM.render(<input type="text" />, div);
      // Change
      node.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );
      // Unmount
      ReactDOM.unmountComponentAtNode(div);
    } finally {
      document.createElement = originalCreateElement;
    }
  });

  describe('async mode', () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.enableAsyncSubtreeAPI = true;
      ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
      ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
      ReactDOM = require('react-dom');
    });
    it('text input', () => {
      const root = ReactDOM.unstable_createRoot(container);
      let input;

      let ops = [];

      class ControlledInput extends React.Component {
        state = {value: 'initial'};
        onChange = event => this.setState({value: event.target.value});
        render() {
          ops.push(`render: ${this.state.value}`);
          const controlledValue =
            this.state.value === 'changed' ? 'changed [!]' : this.state.value;
          return (
            <input
              ref={el => (input = el)}
              type="text"
              value={controlledValue}
              onChange={this.onChange}
            />
          );
        }
      }

      // Initial mount. Test that this is async.
      root.render(<ControlledInput />);
      // Should not have flushed yet.
      expect(ops).toEqual([]);
      expect(input).toBe(undefined);
      // Flush callbacks.
      jest.runAllTimers();
      expect(ops).toEqual(['render: initial']);
      expect(input.value).toBe('initial');

      ops = [];

      // Trigger a change event.
      setUntrackedValue.call(input, 'changed');
      input.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      // Change should synchronously flush
      expect(ops).toEqual(['render: changed']);
      // Value should be the controlled value, not the original one
      expect(input.value).toBe('changed [!]');
    });

    it('checkbox input', () => {
      const root = ReactDOM.unstable_createRoot(container);
      let input;

      let ops = [];

      class ControlledInput extends React.Component {
        state = {checked: false};
        onChange = event => {
          this.setState({checked: event.target.checked});
        };
        render() {
          ops.push(`render: ${this.state.checked}`);
          const controlledValue = this.props.reverse
            ? !this.state.checked
            : this.state.checked;
          return (
            <input
              ref={el => (input = el)}
              type="checkbox"
              checked={controlledValue}
              onChange={this.onChange}
            />
          );
        }
      }

      // Initial mount. Test that this is async.
      root.render(<ControlledInput reverse={false} />);
      // Should not have flushed yet.
      expect(ops).toEqual([]);
      expect(input).toBe(undefined);
      // Flush callbacks.
      jest.runAllTimers();
      expect(ops).toEqual(['render: false']);
      expect(input.checked).toBe(false);

      ops = [];

      // Trigger a change event.
      input.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );
      // Change should synchronously flush
      expect(ops).toEqual(['render: true']);
      expect(input.checked).toBe(true);

      // Now let's make sure we're using the controlled value.
      root.render(<ControlledInput reverse={true} />);
      jest.runAllTimers();

      ops = [];

      // Trigger another change event.
      input.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );
      // Change should synchronously flush
      expect(ops).toEqual(['render: true']);
      expect(input.checked).toBe(false);
    });

    it('textarea', () => {
      const root = ReactDOM.unstable_createRoot(container);
      let textarea;

      let ops = [];

      class ControlledTextarea extends React.Component {
        state = {value: 'initial'};
        onChange = event => this.setState({value: event.target.value});
        render() {
          ops.push(`render: ${this.state.value}`);
          const controlledValue =
            this.state.value === 'changed' ? 'changed [!]' : this.state.value;
          return (
            <textarea
              ref={el => (textarea = el)}
              type="text"
              value={controlledValue}
              onChange={this.onChange}
            />
          );
        }
      }

      // Initial mount. Test that this is async.
      root.render(<ControlledTextarea />);
      // Should not have flushed yet.
      expect(ops).toEqual([]);
      expect(textarea).toBe(undefined);
      // Flush callbacks.
      jest.runAllTimers();
      expect(ops).toEqual(['render: initial']);
      expect(textarea.value).toBe('initial');

      ops = [];

      // Trigger a change event.
      setUntrackedTextareaValue.call(textarea, 'changed');
      textarea.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      // Change should synchronously flush
      expect(ops).toEqual(['render: changed']);
      // Value should be the controlled value, not the original one
      expect(textarea.value).toBe('changed [!]');
    });

    it('parent of input', () => {
      const root = ReactDOM.unstable_createRoot(container);
      let input;

      let ops = [];

      class ControlledInput extends React.Component {
        state = {value: 'initial'};
        onChange = event => this.setState({value: event.target.value});
        render() {
          ops.push(`render: ${this.state.value}`);
          const controlledValue =
            this.state.value === 'changed' ? 'changed [!]' : this.state.value;
          return (
            <div onChange={this.onChange}>
              <input
                ref={el => (input = el)}
                type="text"
                value={controlledValue}
                onChange={() => {
                  // Does nothing. Parent handler is reponsible for updating.
                }}
              />
            </div>
          );
        }
      }

      // Initial mount. Test that this is async.
      root.render(<ControlledInput />);
      // Should not have flushed yet.
      expect(ops).toEqual([]);
      expect(input).toBe(undefined);
      // Flush callbacks.
      jest.runAllTimers();
      expect(ops).toEqual(['render: initial']);
      expect(input.value).toBe('initial');

      ops = [];

      // Trigger a change event.
      setUntrackedValue.call(input, 'changed');
      input.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      // Change should synchronously flush
      expect(ops).toEqual(['render: changed']);
      // Value should be the controlled value, not the original one
      expect(input.value).toBe('changed [!]');
    });

    it('is async for non-input events', () => {
      const root = ReactDOM.unstable_createRoot(container);
      let input;

      let ops = [];

      class ControlledInput extends React.Component {
        state = {value: 'initial'};
        onChange = event => this.setState({value: event.target.value});
        reset = () => {
          this.setState({value: ''});
        };
        render() {
          ops.push(`render: ${this.state.value}`);
          const controlledValue =
            this.state.value === 'changed' ? 'changed [!]' : this.state.value;
          return (
            <input
              ref={el => (input = el)}
              type="text"
              value={controlledValue}
              onChange={this.onChange}
              onClick={this.reset}
            />
          );
        }
      }

      // Initial mount. Test that this is async.
      root.render(<ControlledInput />);
      // Should not have flushed yet.
      expect(ops).toEqual([]);
      expect(input).toBe(undefined);
      // Flush callbacks.
      jest.runAllTimers();
      expect(ops).toEqual(['render: initial']);
      expect(input.value).toBe('initial');

      ops = [];

      // Trigger a click event
      input.dispatchEvent(
        new Event('click', {bubbles: true, cancelable: true}),
      );
      // Nothing should have changed
      expect(ops).toEqual([]);
      expect(input.value).toBe('initial');

      // Flush callbacks.
      jest.runAllTimers();
      // Now the click update has flushed.
      expect(ops).toEqual(['render: ']);
      expect(input.value).toBe('');
    });
  });
});
