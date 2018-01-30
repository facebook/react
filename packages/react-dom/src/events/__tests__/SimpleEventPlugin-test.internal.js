/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('SimpleEventPlugin', function() {
  let React;
  let ReactDOM;
  let ReactTestUtils;
  let ReactFeatureFlags;

  let onClick;

  function expectClickThru(element) {
    ReactTestUtils.SimulateNative.click(ReactDOM.findDOMNode(element));
    expect(onClick.mock.calls.length).toBe(1);
  }

  function expectNoClickThru(element) {
    ReactTestUtils.SimulateNative.click(ReactDOM.findDOMNode(element));
    expect(onClick.mock.calls.length).toBe(0);
  }

  function mounted(element) {
    element = ReactTestUtils.renderIntoDocument(element);
    return element;
  }

  beforeEach(function() {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');

    onClick = jest.fn();
  });

  it('A non-interactive tags click when disabled', function() {
    const element = <div onClick={onClick} />;
    expectClickThru(mounted(element));
  });

  it('A non-interactive tags clicks bubble when disabled', function() {
    const element = ReactTestUtils.renderIntoDocument(
      <div onClick={onClick}>
        <div />
      </div>,
    );
    const child = ReactDOM.findDOMNode(element).firstChild;

    ReactTestUtils.SimulateNative.click(child);
    expect(onClick.mock.calls.length).toBe(1);
  });

  it('does not register a click when clicking a child of a disabled element', function() {
    const element = ReactTestUtils.renderIntoDocument(
      <button onClick={onClick} disabled={true}>
        <span />
      </button>,
    );
    const child = ReactDOM.findDOMNode(element).querySelector('span');

    ReactTestUtils.SimulateNative.click(child);
    expect(onClick.mock.calls.length).toBe(0);
  });

  it('triggers click events for children of disabled elements', function() {
    const element = ReactTestUtils.renderIntoDocument(
      <button disabled={true}>
        <span onClick={onClick} />
      </button>,
    );
    const child = ReactDOM.findDOMNode(element).querySelector('span');

    ReactTestUtils.SimulateNative.click(child);
    expect(onClick.mock.calls.length).toBe(1);
  });

  it('triggers parent captured click events when target is a child of a disabled elements', function() {
    const element = ReactTestUtils.renderIntoDocument(
      <div onClickCapture={onClick}>
        <button disabled={true}>
          <span />
        </button>
      </div>,
    );
    const child = ReactDOM.findDOMNode(element).querySelector('span');

    ReactTestUtils.SimulateNative.click(child);
    expect(onClick.mock.calls.length).toBe(1);
  });

  it('triggers captured click events for children of disabled elements', function() {
    const element = ReactTestUtils.renderIntoDocument(
      <button disabled={true}>
        <span onClickCapture={onClick} />
      </button>,
    );
    const child = ReactDOM.findDOMNode(element).querySelector('span');

    ReactTestUtils.SimulateNative.click(child);
    expect(onClick.mock.calls.length).toBe(1);
  });

  ['button', 'input', 'select', 'textarea'].forEach(function(tagName) {
    describe(tagName, function() {
      it('should forward clicks when it starts out not disabled', () => {
        const element = React.createElement(tagName, {
          onClick: onClick,
        });

        expectClickThru(mounted(element));
      });

      it('should not forward clicks when it starts out disabled', () => {
        const element = React.createElement(tagName, {
          onClick: onClick,
          disabled: true,
        });

        expectNoClickThru(mounted(element));
      });

      it('should forward clicks when it becomes not disabled', () => {
        const container = document.createElement('div');
        let element = ReactDOM.render(
          React.createElement(tagName, {onClick: onClick, disabled: true}),
          container,
        );
        element = ReactDOM.render(
          React.createElement(tagName, {onClick: onClick}),
          container,
        );
        expectClickThru(element);
      });

      it('should not forward clicks when it becomes disabled', () => {
        const container = document.createElement('div');
        let element = ReactDOM.render(
          React.createElement(tagName, {onClick: onClick}),
          container,
        );
        element = ReactDOM.render(
          React.createElement(tagName, {onClick: onClick, disabled: true}),
          container,
        );
        expectNoClickThru(element);
      });

      it('should work correctly if the listener is changed', () => {
        const container = document.createElement('div');
        let element = ReactDOM.render(
          React.createElement(tagName, {onClick: onClick, disabled: true}),
          container,
        );
        element = ReactDOM.render(
          React.createElement(tagName, {onClick: onClick, disabled: false}),
          container,
        );
        expectClickThru(element);
      });
    });
  });

  describe('interactive events, in async mode', () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.enableAsyncSubtreeAPI = true;
      ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
      ReactFeatureFlags.enableCreateRoot = true;
      ReactDOM = require('react-dom');
    });

    it('flushes pending interactive work before extracting event handler', () => {
      const container = document.createElement('div');
      const root = ReactDOM.createRoot(container);
      document.body.appendChild(container);

      let ops = [];

      let button;
      class Button extends React.Component {
        state = {disabled: false};
        onClick = () => {
          // Perform some side-effect
          ops.push('Side-effect');
          // Disable the button
          this.setState({disabled: true});
        };
        render() {
          ops.push(
            `render button: ${this.state.disabled ? 'disabled' : 'enabled'}`,
          );
          return (
            <button
              ref={el => (button = el)}
              // Handler is removed after the first click
              onClick={this.state.disabled ? null : this.onClick}
            />
          );
        }
      }

      // Initial mount
      root.render(<Button />);
      // Should not have flushed yet because it's async
      expect(ops).toEqual([]);
      expect(button).toBe(undefined);
      // Flush async work
      jest.runAllTimers();
      expect(ops).toEqual(['render button: enabled']);

      ops = [];

      function click() {
        button.dispatchEvent(
          new MouseEvent('click', {bubbles: true, cancelable: true}),
        );
      }

      // Click the button to trigger the side-effect
      click();
      expect(ops).toEqual([
        // The handler fired
        'Side-effect',
        // but the component did not re-render yet, because it's async
      ]);

      ops = [];

      // Click the button again
      click();
      expect(ops).toEqual([
        // Before handling this second click event, the previous interactive
        // update is flushed
        'render button: disabled',
        // The event handler was removed from the button, so there's no second
        // side-effect
      ]);

      ops = [];

      // The handler should not fire again no matter how many times we
      // click the handler.
      click();
      click();
      click();
      click();
      click();
      jest.runAllTimers();
      expect(ops).toEqual([]);
    });

    it('end result of many interactive updates is deterministic', () => {
      const container = document.createElement('div');
      const root = ReactDOM.createRoot(container);
      document.body.appendChild(container);

      let button;
      class Button extends React.Component {
        state = {count: 0};
        render() {
          return (
            <button
              ref={el => (button = el)}
              onClick={() =>
                // Intentionally not using the updater form here
                this.setState({count: this.state.count + 1})
              }>
              Count: {this.state.count}
            </button>
          );
        }
      }

      // Initial mount
      root.render(<Button />);
      // Should not have flushed yet because it's async
      expect(button).toBe(undefined);
      // Flush async work
      jest.runAllTimers();
      expect(button.textContent).toEqual('Count: 0');

      function click() {
        button.dispatchEvent(
          new MouseEvent('click', {bubbles: true, cancelable: true}),
        );
      }

      // Click the button a single time
      click();
      // The counter should not have updated yet because it's async
      expect(button.textContent).toEqual('Count: 0');

      // Click the button many more times
      click();
      click();
      click();
      click();
      click();
      click();

      // Flush the remaining work
      jest.runAllTimers();
      // The counter should equal the total number of clicks
      expect(button.textContent).toEqual('Count: 7');
    });

    it('flushes lowest pending interactive priority', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      let button;
      class Button extends React.Component {
        state = {lowPriCount: 0};
        render() {
          return (
            <button
              ref={el => (button = el)}
              onClick={
                // Intentionally not using the updater form here
                () => this.setState({lowPriCount: this.state.lowPriCount + 1})
              }>
              High-pri count: {this.props.highPriCount}, Low-pri count:{' '}
              {this.state.lowPriCount}
            </button>
          );
        }
      }

      class Wrapper extends React.Component {
        state = {highPriCount: 0};
        render() {
          return (
            <div
              onClick={
                // Intentionally not using the updater form here
                () => this.setState({highPriCount: this.state.highPriCount + 1})
              }>
              <React.unstable_AsyncMode>
                <Button highPriCount={this.state.highPriCount} />
              </React.unstable_AsyncMode>
            </div>
          );
        }
      }

      // Initial mount
      ReactDOM.render(<Wrapper />, container);
      expect(button.textContent).toEqual('High-pri count: 0, Low-pri count: 0');

      function click() {
        button.dispatchEvent(
          new MouseEvent('click', {bubbles: true, cancelable: true}),
        );
      }

      // Click the button a single time
      click();
      // The high-pri counter should flush synchronously, but not the
      // low-pri counter
      expect(button.textContent).toEqual('High-pri count: 1, Low-pri count: 0');

      // Click the button many more times
      click();
      click();
      click();
      click();
      click();
      click();

      // Flush the remaining work
      jest.runAllTimers();
      // Both counters should equal the total number of clicks
      expect(button.textContent).toEqual('High-pri count: 7, Low-pri count: 7');
    });
  });

  describe('iOS bubbling click fix', function() {
    // See http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html

    it('does not add a local click to interactive elements', function() {
      const container = document.createElement('div');

      ReactDOM.render(<button onClick={onClick} />, container);

      const node = container.firstChild;

      node.dispatchEvent(new MouseEvent('click'));

      expect(onClick.mock.calls.length).toBe(0);
    });

    it('adds a local click listener to non-interactive elements', function() {
      const container = document.createElement('div');

      ReactDOM.render(<div onClick={onClick} />, container);

      const node = container.firstChild;

      node.dispatchEvent(new MouseEvent('click'));

      expect(onClick.mock.calls.length).toBe(0);
    });
  });
});
