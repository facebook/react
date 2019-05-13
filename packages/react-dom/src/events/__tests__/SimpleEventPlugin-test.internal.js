/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  let ReactFeatureFlags;
  let Scheduler;

  let onClick;
  let container;

  function expectClickThru(element) {
    element.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  }

  function expectNoClickThru(element) {
    element.click();
    expect(onClick).toHaveBeenCalledTimes(0);
  }

  function mounted(element) {
    container = document.createElement('div');
    document.body.appendChild(container);
    element = ReactDOM.render(element, container);
    return element;
  }

  beforeEach(function() {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');

    onClick = jest.fn();
  });

  afterEach(() => {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
      container = null;
    }
  });

  it('A non-interactive tags click when disabled', function() {
    const element = <div onClick={onClick} />;
    expectClickThru(mounted(element));
  });

  it('A non-interactive tags clicks bubble when disabled', function() {
    const element = mounted(
      <div onClick={onClick}>
        <div />
      </div>,
    );
    const child = element.firstChild;
    child.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not register a click when clicking a child of a disabled element', function() {
    const element = mounted(
      <button onClick={onClick} disabled={true}>
        <span />
      </button>,
    );
    const child = element.querySelector('span');

    child.click();
    expect(onClick).toHaveBeenCalledTimes(0);
  });

  it('triggers click events for children of disabled elements', function() {
    const element = mounted(
      <button disabled={true}>
        <span onClick={onClick} />
      </button>,
    );
    const child = element.querySelector('span');

    child.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('triggers parent captured click events when target is a child of a disabled elements', function() {
    const element = mounted(
      <div onClickCapture={onClick}>
        <button disabled={true}>
          <span />
        </button>
      </div>,
    );
    const child = element.querySelector('span');

    child.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('triggers captured click events for children of disabled elements', function() {
    const element = mounted(
      <button disabled={true}>
        <span onClickCapture={onClick} />
      </button>,
    );
    const child = element.querySelector('span');

    child.click();
    expect(onClick).toHaveBeenCalledTimes(1);
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
        container = document.createElement('div');
        document.body.appendChild(container);
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
        container = document.createElement('div');
        document.body.appendChild(container);
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
        container = document.createElement('div');
        document.body.appendChild(container);
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

  it('batches updates that occur as a result of a nested event dispatch', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    let ops = [];
    let button;
    class Button extends React.Component {
      state = {count: 0};
      increment = () =>
        this.setState(state => ({
          count: state.count + 1,
        }));
      componentDidUpdate() {
        ops.push(`didUpdate - Count: ${this.state.count}`);
      }
      render() {
        return (
          <button
            ref={el => (button = el)}
            onFocus={this.increment}
            onClick={() => {
              // The focus call synchronously dispatches a nested event. All of
              // the updates in this handler should be batched together.
              this.increment();
              button.focus();
              this.increment();
            }}>
            Count: {this.state.count}
          </button>
        );
      }
    }

    function click() {
      button.dispatchEvent(
        new MouseEvent('click', {bubbles: true, cancelable: true}),
      );
    }

    ReactDOM.render(<Button />, container);
    expect(button.textContent).toEqual('Count: 0');
    expect(ops).toEqual([]);

    click();

    // There should be exactly one update.
    expect(ops).toEqual(['didUpdate - Count: 3']);
    expect(button.textContent).toEqual('Count: 3');
  });

  describe('interactive events, in async mode', () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
      ReactDOM = require('react-dom');
      Scheduler = require('scheduler');
    });

    it('flushes pending interactive work before extracting event handler', () => {
      container = document.createElement('div');
      const root = ReactDOM.unstable_createRoot(container);
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
      Scheduler.flushAll();
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
      Scheduler.flushAll();
      expect(ops).toEqual([]);
    });

    it('end result of many interactive updates is deterministic', () => {
      container = document.createElement('div');
      const root = ReactDOM.unstable_createRoot(container);
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
      Scheduler.flushAll();
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
      Scheduler.flushAll();
      // The counter should equal the total number of clicks
      expect(button.textContent).toEqual('Count: 7');
    });

    it('flushes discrete updates in order', () => {
      container = document.createElement('div');
      document.body.appendChild(container);

      let button;
      class Button extends React.Component {
        state = {lowPriCount: 0};
        render() {
          const text = `High-pri count: ${
            this.props.highPriCount
          }, Low-pri count: ${this.state.lowPriCount}`;
          Scheduler.yieldValue(text);
          return (
            <button
              ref={el => (button = el)}
              onClick={() => {
                Scheduler.unstable_next(() => {
                  this.setState(state => ({
                    lowPriCount: state.lowPriCount + 1,
                  }));
                });
              }}>
              {text}
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
                // Intentionally not using the updater form here, to test
                // that updates are serially processed.
                () => {
                  this.setState({highPriCount: this.state.highPriCount + 1});
                }
              }>
              <Button highPriCount={this.state.highPriCount} />
            </div>
          );
        }
      }

      // Initial mount
      const root = ReactDOM.unstable_createRoot(container);
      root.render(<Wrapper />);
      expect(Scheduler).toFlushAndYield([
        'High-pri count: 0, Low-pri count: 0',
      ]);
      expect(button.textContent).toEqual('High-pri count: 0, Low-pri count: 0');

      function click() {
        button.dispatchEvent(
          new MouseEvent('click', {bubbles: true, cancelable: true}),
        );
      }

      // Click the button a single time
      click();
      // Nothing should flush on the first click.
      expect(Scheduler).toHaveYielded([]);
      // Click again. This will force the previous discrete update to flush. But
      // only the high-pri count will increase.
      click();
      expect(Scheduler).toHaveYielded(['High-pri count: 1, Low-pri count: 0']);
      expect(button.textContent).toEqual('High-pri count: 1, Low-pri count: 0');

      // Click the button many more times
      click();
      click();
      click();
      click();
      click();
      click();

      // Flush the remaining work.
      expect(Scheduler).toHaveYielded([
        'High-pri count: 2, Low-pri count: 0',
        'High-pri count: 3, Low-pri count: 0',
        'High-pri count: 4, Low-pri count: 0',
        'High-pri count: 5, Low-pri count: 0',
        'High-pri count: 6, Low-pri count: 0',
        'High-pri count: 7, Low-pri count: 0',
      ]);

      // At the end, both counters should equal the total number of clicks
      expect(Scheduler).toFlushAndYield([
        'High-pri count: 8, Low-pri count: 0',
        'High-pri count: 8, Low-pri count: 8',
      ]);
      expect(button.textContent).toEqual('High-pri count: 8, Low-pri count: 8');
    });
  });

  describe('iOS bubbling click fix', function() {
    // See http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html

    it('does not add a local click to interactive elements', function() {
      container = document.createElement('div');

      ReactDOM.render(<button onClick={onClick} />, container);

      const node = container.firstChild;

      node.dispatchEvent(new MouseEvent('click'));

      expect(onClick).toHaveBeenCalledTimes(0);
    });

    it('adds a local click listener to non-interactive elements', function() {
      container = document.createElement('div');

      ReactDOM.render(<div onClick={onClick} />, container);

      const node = container.firstChild;

      node.dispatchEvent(new MouseEvent('click'));

      expect(onClick).toHaveBeenCalledTimes(0);
    });
  });
});
