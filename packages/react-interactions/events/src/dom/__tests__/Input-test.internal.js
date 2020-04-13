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
let InputResponder;
let useInput;
let Scheduler;

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

const modulesInit = () => {
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableDeprecatedFlareAPI = true;

  React = require('react');
  ReactDOM = require('react-dom');
  Scheduler = require('scheduler');

  // TODO: This import throws outside of experimental mode. Figure out better
  // strategy for gated imports.
  if (__EXPERIMENTAL__) {
    InputResponder = require('react-interactions/events/input').InputResponder;
    useInput = require('react-interactions/events/input').useInput;
  }
};

describe('Input event responder', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    modulesInit();

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  describe('disabled', () => {
    let onChange, onValueChange, ref;

    const componentInit = () => {
      onChange = jest.fn();
      onValueChange = jest.fn();
      ref = React.createRef();

      function Component() {
        const listener = useInput({
          disabled: true,
          onChange,
          onValueChange,
        });
        return <input ref={ref} DEPRECATED_flareListeners={listener} />;
      }
      ReactDOM.render(<Component />, container);
    };

    // @gate experimental
    it('prevents custom events being dispatched', () => {
      componentInit();
      ref.current.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );
      ref.current.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      expect(onChange).not.toBeCalled();
      expect(onValueChange).not.toBeCalled();
    });
  });

  // These were taken from the original ChangeEventPlugin-test.
  // They've been updated and cleaned up for React Flare.
  describe('onChange', () => {
    // We try to avoid firing "duplicate" React change events.
    // However, to tell which events are "duplicates" and should be ignored,
    // we are tracking the "current" input value, and only respect events
    // that occur after it changes. In most of these tests, we verify that we
    // keep track of the "current" value and only fire events when it changes.
    // See https://github.com/facebook/react/pull/5746.

    // @gate experimental
    it('should consider initial text value to be current', () => {
      let onChangeCalled = 0;
      let onValueChangeCalled = 0;
      const ref = React.createRef();

      function onChange(e) {
        onChangeCalled++;
        expect(e.type).toBe('change');
      }

      function onValueChange(e) {
        onValueChangeCalled++;
      }

      function Component() {
        const listener = useInput({
          onChange,
          onValueChange,
        });
        return (
          <input
            type="text"
            ref={ref}
            defaultValue="foo"
            DEPRECATED_flareListeners={listener}
          />
        );
      }
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );
      ref.current.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );

      if (ReactFeatureFlags.disableInputAttributeSyncing) {
        // TODO: figure out why. This might be a bug.
        expect(onChangeCalled).toBe(1);
        expect(onValueChangeCalled).toBe(1);
      } else {
        expect(onChangeCalled).toBe(0);
        expect(onValueChangeCalled).toBe(0);
      }
    });

    // @gate experimental
    it('should consider initial checkbox checked=true to be current', () => {
      let onChangeCalled = 0;
      let onValueChangeCalled = 0;
      const ref = React.createRef();

      function onChange(e) {
        onChangeCalled++;
        expect(e.type).toBe('change');
      }

      function onValueChange(e) {
        onValueChangeCalled++;
      }

      function Component() {
        const listener = useInput({
          onChange,
          onValueChange,
        });
        return (
          <input
            type="checkbox"
            ref={ref}
            defaultChecked={true}
            DEPRECATED_flareListeners={listener}
          />
        );
      }
      ReactDOM.render(<Component />, container);

      // Secretly, set `checked` to false, so that dispatching the `click` will
      // make it `true` again. Thus, at the time of the event, React should not
      // consider it a change from the initial `true` value.
      setUntrackedChecked.call(ref.current, false);
      ref.current.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );

      // There should be no React change events because the value stayed the same.
      expect(onChangeCalled).toBe(0);
      expect(onValueChangeCalled).toBe(0);
    });

    // @gate experimental
    it('should consider initial checkbox checked=false to be current', () => {
      let onChangeCalled = 0;
      let onValueChangeCalled = 0;
      const ref = React.createRef();

      function onChange(e) {
        onChangeCalled++;
        expect(e.type).toBe('change');
      }

      function onValueChange(e) {
        onValueChangeCalled++;
      }

      function Component() {
        const listener = useInput({
          onChange,
          onValueChange,
        });
        return (
          <input
            type="checkbox"
            ref={ref}
            defaultChecked={false}
            DEPRECATED_flareListeners={listener}
          />
        );
      }
      ReactDOM.render(<Component />, container);

      // Secretly, set `checked` to true, so that dispatching the `click` will
      // make it `false` again. Thus, at the time of the event, React should not
      // consider it a change from the initial `false` value.
      setUntrackedChecked.call(ref.current, true);
      ref.current.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );
      // There should be no React change events because the value stayed the same.
      expect(onChangeCalled).toBe(0);
      expect(onValueChangeCalled).toBe(0);
    });

    // @gate experimental
    it('should fire change for checkbox input', () => {
      let onChangeCalled = 0;
      let onValueChangeCalled = 0;
      const ref = React.createRef();

      function onChange(e) {
        onChangeCalled++;
        expect(e.type).toBe('change');
      }

      function onValueChange(e) {
        onValueChangeCalled++;
      }

      function Component() {
        const listener = useInput({
          onChange,
          onValueChange,
        });
        return (
          <input
            type="checkbox"
            ref={ref}
            DEPRECATED_flareListeners={listener}
          />
        );
      }
      ReactDOM.render(<Component />, container);

      ref.current.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );
      // Note: unlike with text input events, dispatching `click` actually
      // toggles the checkbox and updates its `checked` value.
      expect(ref.current.checked).toBe(true);
      expect(onChangeCalled).toBe(1);
      expect(onValueChangeCalled).toBe(1);

      expect(ref.current.checked).toBe(true);
      ref.current.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );
      expect(ref.current.checked).toBe(false);
      expect(onChangeCalled).toBe(2);
      expect(onValueChangeCalled).toBe(2);
    });

    // @gate experimental
    it('should not fire change setting the value programmatically', () => {
      let onChangeCalled = 0;
      let onValueChangeCalled = 0;
      const ref = React.createRef();

      function onChange(e) {
        onChangeCalled++;
        expect(e.type).toBe('change');
      }

      function onValueChange(e) {
        onValueChangeCalled++;
      }

      function Component() {
        const listener = useInput({
          onChange,
          onValueChange,
        });
        return (
          <input
            type="text"
            defaultValue="foo"
            ref={ref}
            DEPRECATED_flareListeners={listener}
          />
        );
      }
      ReactDOM.render(<Component />, container);

      // Set it programmatically.
      ref.current.value = 'bar';
      // Even if a DOM input event fires, React sees that the real input value now
      // ('bar') is the same as the "current" one we already recorded.
      ref.current.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      expect(ref.current.value).toBe('bar');
      // In this case we don't expect to get a React event.
      expect(onChangeCalled).toBe(0);
      expect(onValueChangeCalled).toBe(0);

      // However, we can simulate user typing by calling the underlying setter.
      setUntrackedValue.call(ref.current, 'foo');
      // Now, when the event fires, the real input value ('foo') differs from the
      // "current" one we previously recorded ('bar').
      ref.current.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      expect(ref.current.value).toBe('foo');
      // In this case React should fire an event for it.
      expect(onChangeCalled).toBe(1);
      expect(onValueChangeCalled).toBe(1);

      // Verify again that extra events without real changes are ignored.
      ref.current.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      expect(onChangeCalled).toBe(1);
      expect(onValueChangeCalled).toBe(1);
    });

    // @gate experimental
    it('should not distinguish equal string and number values', () => {
      let onChangeCalled = 0;
      let onValueChangeCalled = 0;
      const ref = React.createRef();

      function onChange(e) {
        onChangeCalled++;
        expect(e.type).toBe('change');
      }

      function onValueChange(e) {
        onValueChangeCalled++;
      }

      function Component() {
        const listener = useInput({
          onChange,
          onValueChange,
        });
        return (
          <input
            type="text"
            defaultValue="42"
            ref={ref}
            DEPRECATED_flareListeners={listener}
          />
        );
      }
      ReactDOM.render(<Component />, container);

      // When we set `value` as a property, React updates the "current" value
      // that it tracks internally. The "current" value is later used to determine
      // whether a change event is a duplicate or not.
      // Even though we set value to a number, we still shouldn't get a change
      // event because as a string, it's equal to the initial value ('42').
      ref.current.value = 42;
      ref.current.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      expect(ref.current.value).toBe('42');
      expect(onChangeCalled).toBe(0);
      expect(onValueChangeCalled).toBe(0);
    });

    // See a similar input test above for a detailed description of why.
    // @gate experimental
    it('should not fire change when setting checked programmatically', () => {
      let onChangeCalled = 0;
      let onValueChangeCalled = 0;
      const ref = React.createRef();

      function onChange(e) {
        onChangeCalled++;
        expect(e.type).toBe('change');
      }

      function onValueChange(e) {
        onValueChangeCalled++;
      }

      function Component() {
        const listener = useInput({
          onChange,
          onValueChange,
        });
        return (
          <input
            type="checkbox"
            defaultChecked={false}
            ref={ref}
            DEPRECATED_flareListeners={listener}
          />
        );
      }
      ReactDOM.render(<Component />, container);

      // Set the value, updating the "current" value that React tracks to true.
      ref.current.checked = true;
      // Under the hood, uncheck the box so that the click will "check" it again.
      setUntrackedChecked.call(ref.current, false);
      ref.current.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );
      expect(ref.current.checked).toBe(true);
      // We don't expect a React event because at the time of the click, the real
      // checked value (true) was the same as the last recorded "current" value
      // (also true).
      expect(onChangeCalled).toBe(0);
      expect(onValueChangeCalled).toBe(0);

      // However, simulating a normal click should fire a React event because the
      // real value (false) would have changed from the last tracked value (true).
      ref.current.click();
      expect(onChangeCalled).toBe(1);
      expect(onValueChangeCalled).toBe(1);
    });

    // @gate experimental
    it('should only fire change for checked radio button once', () => {
      let onChangeCalled = 0;
      let onValueChangeCalled = 0;
      const ref = React.createRef();

      function onChange(e) {
        onChangeCalled++;
        expect(e.type).toBe('change');
      }

      function onValueChange(e) {
        onValueChangeCalled++;
      }

      function Component() {
        const listener = useInput({
          onChange,
          onValueChange,
        });
        return (
          <input type="radio" ref={ref} DEPRECATED_flareListeners={listener} />
        );
      }
      ReactDOM.render(<Component />, container);

      setUntrackedChecked.call(ref.current, true);
      ref.current.dispatchEvent(
        new Event('click', {bubbles: true, cancelable: true}),
      );
      ref.current.dispatchEvent(
        new Event('click', {bubbles: true, cancelable: true}),
      );
      expect(onChangeCalled).toBe(1);
      expect(onValueChangeCalled).toBe(1);
    });

    // @gate experimental
    it('should track radio button cousins in a group', () => {
      let onChangeCalled1 = 0;
      let onValueChangeCalled1 = 0;
      let onChangeCalled2 = 0;
      let onValueChangeCalled2 = 0;
      const ref = React.createRef();

      function onChange1(e) {
        onChangeCalled1++;
        expect(e.type).toBe('change');
      }

      function onValueChange1(e) {
        onValueChangeCalled1++;
      }

      function onChange2(e) {
        onChangeCalled2++;
        expect(e.type).toBe('change');
      }

      function onValueChange2(e) {
        onValueChangeCalled2++;
      }

      function Radio1() {
        const listener = useInput({
          onChange: onChange1,
          onValueChange: onValueChange1,
        });
        return (
          <input
            type="radio"
            name="group"
            DEPRECATED_flareListeners={listener}
          />
        );
      }

      function Radio2() {
        const listener = useInput({
          onChange: onChange2,
          onValueChange: onValueChange2,
        });
        return (
          <input
            type="radio"
            name="group"
            DEPRECATED_flareListeners={listener}
          />
        );
      }

      function Component() {
        return (
          <div ref={ref}>
            <Radio1 />
            <Radio2 />
          </div>
        );
      }
      ReactDOM.render(<Component />, container);

      const option1 = ref.current.childNodes[0];
      const option2 = ref.current.childNodes[1];

      // Select first option.
      option1.click();
      expect(onChangeCalled1).toBe(1);
      expect(onValueChangeCalled1).toBe(1);
      expect(onChangeCalled2).toBe(0);
      expect(onValueChangeCalled2).toBe(0);

      // Select second option.
      option2.click();
      expect(onChangeCalled1).toBe(1);
      expect(onValueChangeCalled1).toBe(1);
      expect(onChangeCalled2).toBe(1);
      expect(onValueChangeCalled2).toBe(1);

      // Select the first option.
      // It should receive the React change event again.
      option1.click();
      expect(onChangeCalled1).toBe(2);
      expect(onValueChangeCalled1).toBe(2);
      expect(onChangeCalled2).toBe(1);
      expect(onValueChangeCalled2).toBe(1);
    });

    // @gate experimental
    it('should deduplicate input value change events', () => {
      let onChangeCalled = 0;
      let onValueChangeCalled = 0;
      const ref = React.createRef();

      function onChange(e) {
        onChangeCalled++;
        expect(e.type).toBe('change');
      }

      function onValueChange(e) {
        onValueChangeCalled++;
      }

      ['text', 'number', 'range'].forEach(type => {
        onChangeCalled = 0;
        onValueChangeCalled = 0;
        function Component() {
          const listener = useInput({
            onChange,
            onValueChange,
          });
          return (
            <input
              type={type}
              name="group"
              ref={ref}
              DEPRECATED_flareListeners={listener}
            />
          );
        }
        ReactDOM.render(<Component />, container);
        // Should be ignored (no change):
        ref.current.dispatchEvent(
          new Event('change', {bubbles: true, cancelable: true}),
        );
        setUntrackedValue.call(ref.current, '42');
        ref.current.dispatchEvent(
          new Event('change', {bubbles: true, cancelable: true}),
        );
        // Should be ignored (no change):
        ref.current.dispatchEvent(
          new Event('change', {bubbles: true, cancelable: true}),
        );
        expect(onChangeCalled).toBe(1);
        expect(onValueChangeCalled).toBe(1);
        ReactDOM.unmountComponentAtNode(container);

        onChangeCalled = 0;
        onValueChangeCalled = 0;
        function Component2() {
          const listener = useInput({
            onChange,
            onValueChange,
          });
          return (
            <input type={type} ref={ref} DEPRECATED_flareListeners={listener} />
          );
        }
        ReactDOM.render(<Component2 />, container);
        // Should be ignored (no change):
        ref.current.dispatchEvent(
          new Event('input', {bubbles: true, cancelable: true}),
        );
        setUntrackedValue.call(ref.current, '42');
        ref.current.dispatchEvent(
          new Event('input', {bubbles: true, cancelable: true}),
        );
        // Should be ignored (no change):
        ref.current.dispatchEvent(
          new Event('input', {bubbles: true, cancelable: true}),
        );
        expect(onChangeCalled).toBe(1);
        expect(onValueChangeCalled).toBe(1);
        ReactDOM.unmountComponentAtNode(container);

        onChangeCalled = 0;
        onValueChangeCalled = 0;
        function Component3() {
          const listener = useInput({
            onChange,
            onValueChange,
          });
          return (
            <input type={type} ref={ref} DEPRECATED_flareListeners={listener} />
          );
        }
        ReactDOM.render(<Component3 />, container);
        // Should be ignored (no change):
        ref.current.dispatchEvent(
          new Event('change', {bubbles: true, cancelable: true}),
        );
        setUntrackedValue.call(ref.current, '42');
        ref.current.dispatchEvent(
          new Event('input', {bubbles: true, cancelable: true}),
        );
        // Should be ignored (no change):
        ref.current.dispatchEvent(
          new Event('change', {bubbles: true, cancelable: true}),
        );
        expect(onChangeCalled).toBe(1);
        expect(onValueChangeCalled).toBe(1);
        ReactDOM.unmountComponentAtNode(container);
      });
    });

    // @gate experimental
    it('should listen for both change and input events when supported', () => {
      let onChangeCalled = 0;
      let onValueChangeCalled = 0;
      const ref = React.createRef();

      function onChange(e) {
        onChangeCalled++;
        expect(e.type).toBe('change');
      }

      function onValueChange(e) {
        onValueChangeCalled++;
      }

      function Component() {
        const listener = useInput({
          onChange,
          onValueChange,
        });
        return (
          <input type="range" ref={ref} DEPRECATED_flareListeners={listener} />
        );
      }
      ReactDOM.render(<Component />, container);

      setUntrackedValue.call(ref.current, 10);
      ref.current.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );

      setUntrackedValue.call(ref.current, 20);
      ref.current.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );

      expect(onChangeCalled).toBe(2);
      expect(onValueChangeCalled).toBe(2);
    });

    // @gate experimental
    it('should only fire events when the value changes for range inputs', () => {
      let onChangeCalled = 0;
      let onValueChangeCalled = 0;
      const ref = React.createRef();

      function onChange(e) {
        onChangeCalled++;
        expect(e.type).toBe('change');
      }

      function onValueChange(e) {
        onValueChangeCalled++;
      }

      function Component() {
        const listener = useInput({
          onChange,
          onValueChange,
        });
        return (
          <input type="range" ref={ref} DEPRECATED_flareListeners={listener} />
        );
      }
      ReactDOM.render(<Component />, container);

      setUntrackedValue.call(ref.current, '40');
      ref.current.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      ref.current.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );

      setUntrackedValue.call(ref.current, 'foo');
      ref.current.dispatchEvent(
        new Event('input', {bubbles: true, cancelable: true}),
      );
      ref.current.dispatchEvent(
        new Event('change', {bubbles: true, cancelable: true}),
      );

      expect(onChangeCalled).toBe(2);
      expect(onValueChangeCalled).toBe(2);
    });

    // @gate experimental || build === "production"
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
        const ref = React.createRef();
        const div = document.createElement('div');
        // Mount
        ReactDOM.render(
          <input type="text" ref={ref} responders={<InputResponder />} />,
          div,
        );
        // Update
        ReactDOM.render(
          <input type="text" ref={ref} responders={<InputResponder />} />,
          div,
        );
        // Change
        ref.current.dispatchEvent(
          new Event('change', {bubbles: true, cancelable: true}),
        );
        // Unmount
        ReactDOM.unmountComponentAtNode(div);
      } finally {
        document.createElement = originalCreateElement;
      }
    });

    describe('concurrent mode', () => {
      // @gate experimental
      // @gate experimental
      it('text input', () => {
        const root = ReactDOM.createRoot(container);
        let input;

        function Component({innerRef, onChange, controlledValue}) {
          const listener = useInput({
            onChange,
          });
          return (
            <input
              type="text"
              ref={innerRef}
              value={controlledValue}
              DEPRECATED_flareListeners={listener}
            />
          );
        }

        class ControlledInput extends React.Component {
          state = {value: 'initial'};
          onChange = event => this.setState({value: event.target.value});
          render() {
            Scheduler.unstable_yieldValue(`render: ${this.state.value}`);
            const controlledValue =
              this.state.value === 'changed' ? 'changed [!]' : this.state.value;
            return (
              <Component
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

        // Trigger a change event.
        setUntrackedValue.call(input, 'changed');
        input.dispatchEvent(
          new Event('input', {bubbles: true, cancelable: true}),
        );
        // Change should synchronously flush
        expect(Scheduler).toHaveYielded(['render: changed']);
        // Value should be the controlled value, not the original one
        expect(input.value).toBe('changed [!]');
      });

      // @gate experimental
      // @gate experimental
      it('checkbox input', () => {
        const root = ReactDOM.createRoot(container);
        let input;

        function Component({innerRef, onChange, controlledValue}) {
          const listener = useInput({
            onChange,
          });
          return (
            <input
              type="checkbox"
              ref={innerRef}
              checked={controlledValue}
              DEPRECATED_flareListeners={listener}
            />
          );
        }

        class ControlledInput extends React.Component {
          state = {checked: false};
          onChange = event => {
            this.setState({checked: event.target.checked});
          };
          render() {
            Scheduler.unstable_yieldValue(`render: ${this.state.checked}`);
            const controlledValue = this.props.reverse
              ? !this.state.checked
              : this.state.checked;
            return (
              <Component
                controlledValue={controlledValue}
                onChange={this.onChange}
                innerRef={el => (input = el)}
              />
            );
          }
        }

        // Initial mount. Test that this is async.
        root.render(<ControlledInput reverse={false} />);
        // Should not have flushed yet.
        expect(Scheduler).toHaveYielded([]);
        expect(input).toBe(undefined);
        // Flush callbacks.
        expect(Scheduler).toFlushAndYield(['render: false']);
        expect(input.checked).toBe(false);

        // Trigger a change event.
        input.dispatchEvent(
          new MouseEvent('click', {bubbles: true, cancelable: true}),
        );
        // Change should synchronously flush
        expect(Scheduler).toHaveYielded(['render: true']);
        expect(input.checked).toBe(true);

        // Now let's make sure we're using the controlled value.
        root.render(<ControlledInput reverse={true} />);
        expect(Scheduler).toFlushAndYield(['render: true']);

        // Trigger another change event.
        input.dispatchEvent(
          new MouseEvent('click', {bubbles: true, cancelable: true}),
        );
        // Change should synchronously flush
        expect(Scheduler).toHaveYielded(['render: true']);
        expect(input.checked).toBe(false);
      });

      // @gate experimental
      // @gate experimental
      it('textarea', () => {
        const root = ReactDOM.createRoot(container);
        let textarea;

        function Component({innerRef, onChange, controlledValue}) {
          const listener = useInput({
            onChange,
          });
          return (
            <textarea
              type="text"
              ref={innerRef}
              value={controlledValue}
              DEPRECATED_flareListeners={listener}
            />
          );
        }

        class ControlledTextarea extends React.Component {
          state = {value: 'initial'};
          onChange = event => this.setState({value: event.target.value});
          render() {
            Scheduler.unstable_yieldValue(`render: ${this.state.value}`);
            const controlledValue =
              this.state.value === 'changed' ? 'changed [!]' : this.state.value;
            return (
              <Component
                onChange={this.onChange}
                innerRef={el => (textarea = el)}
                controlledValue={controlledValue}
              />
            );
          }
        }

        // Initial mount. Test that this is async.
        root.render(<ControlledTextarea />);
        // Should not have flushed yet.
        expect(Scheduler).toHaveYielded([]);
        expect(textarea).toBe(undefined);
        // Flush callbacks.
        expect(Scheduler).toFlushAndYield(['render: initial']);
        expect(textarea.value).toBe('initial');

        // Trigger a change event.
        setUntrackedTextareaValue.call(textarea, 'changed');
        textarea.dispatchEvent(
          new Event('input', {bubbles: true, cancelable: true}),
        );
        // Change should synchronously flush
        expect(Scheduler).toHaveYielded(['render: changed']);
        // Value should be the controlled value, not the original one
        expect(textarea.value).toBe('changed [!]');
      });
    });
  });

  // @gate experimental
  it('expect displayName to show up for event component', () => {
    expect(InputResponder.displayName).toBe('Input');
  });
});
