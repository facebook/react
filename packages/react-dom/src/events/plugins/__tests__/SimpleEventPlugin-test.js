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
  let ReactDOMClient;
  let Scheduler;
  let act;

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
    ReactDOMClient = require('react-dom/client');
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

    let button;
    class Button extends React.Component {
      state = {count: 0};
      increment = () =>
        this.setState(state => ({
          count: state.count + 1,
        }));
      componentDidUpdate() {
        Scheduler.unstable_yieldValue(`didUpdate - Count: ${this.state.count}`);
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
    expect(Scheduler).toHaveYielded([]);

    click();

    // There should be exactly one update.
    expect(Scheduler).toHaveYielded(['didUpdate - Count: 3']);
    expect(button.textContent).toEqual('Count: 3');
  });

  describe('interactive events, in concurrent mode', () => {
    beforeEach(() => {
      jest.resetModules();

      React = require('react');
      ReactDOM = require('react-dom');
      ReactDOMClient = require('react-dom/client');
      Scheduler = require('scheduler');

      act = require('jest-react').act;
    });

    it('flushes pending interactive work before exiting event handler', async () => {
      container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      document.body.appendChild(container);

      let button;
      class Button extends React.Component {
        state = {disabled: false};
        onClick = () => {
          // Perform some side-effect
          Scheduler.unstable_yieldValue('Side-effect');
          // Disable the button
          this.setState({disabled: true});
        };
        render() {
          Scheduler.unstable_yieldValue(
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
      expect(Scheduler).toHaveYielded([]);
      expect(button).toBe(undefined);
      // Flush async work
      expect(Scheduler).toFlushAndYield(['render button: enabled']);

      function click() {
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, 'timeStamp', {
          value: 0,
        });
        button.dispatchEvent(event);
      }

      // Click the button to trigger the side-effect
      await act(async () => click());
      expect(Scheduler).toHaveYielded([
        // The handler fired
        'Side-effect',
        // The component re-rendered synchronously, even in concurrent mode.
        'render button: disabled',
      ]);

      // Click the button again
      click();
      expect(Scheduler).toHaveYielded([
        // The event handler was removed from the button, so there's no effect.
      ]);

      // The handler should not fire again no matter how many times we
      // click the handler.
      click();
      click();
      click();
      click();
      click();
      expect(Scheduler).toFlushAndYield([]);
    });

    // NOTE: This test was written for the old behavior of discrete updates,
    // where they would be async, but flushed early if another discrete update
    // was dispatched.
    it('end result of many interactive updates is deterministic', async () => {
      container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
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
      Scheduler.unstable_flushAll();
      expect(button.textContent).toEqual('Count: 0');

      function click() {
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        Object.defineProperty(event, 'timeStamp', {
          value: 0,
        });
        button.dispatchEvent(event);
      }

      // Click the button a single time
      await act(async () => click());
      // The counter should update synchronously, even in concurrent mode.
      expect(button.textContent).toEqual('Count: 1');

      // Click the button many more times
      await act(async () => click());
      await act(async () => click());
      await act(async () => click());
      await act(async () => click());
      await act(async () => click());
      await act(async () => click());

      // Flush the remaining work
      Scheduler.unstable_flushAll();
      // The counter should equal the total number of clicks
      expect(button.textContent).toEqual('Count: 7');
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

    it('registers passive handlers for events affected by the intervention', () => {
      container = document.createElement('div');

      const passiveEvents = [];
      const nativeAddEventListener = container.addEventListener;
      container.addEventListener = function(type, fn, options) {
        if (options !== null && typeof options === 'object') {
          if (options.passive) {
            passiveEvents.push(type);
          }
        }
        return nativeAddEventListener.apply(this, arguments);
      };

      ReactDOM.render(<div />, container);

      expect(passiveEvents).toEqual([
        'touchstart',
        'touchstart',
        'touchmove',
        'touchmove',
        'wheel',
        'wheel',
      ]);
    });
  });
});
