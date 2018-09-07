/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
let ReactFeatureFlags = require('shared/ReactFeatureFlags');

let ReactDOM;

const AsyncMode = React.unstable_AsyncMode;

const setUntrackedInputValue = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
).set;

describe('ReactDOMFiberAsync', () => {
  let container;

  beforeEach(() => {
    // TODO pull this into helper method, reduce repetition.
    // mock the browser APIs which are used in schedule:
    // - requestAnimationFrame should pass the DOMHighResTimeStamp argument
    // - calling 'window.postMessage' should actually fire postmessage handlers
    global.requestAnimationFrame = function(cb) {
      return setTimeout(() => {
        cb(Date.now());
      });
    };
    const originalAddEventListener = global.addEventListener;
    let postMessageCallback;
    global.addEventListener = function(eventName, callback, useCapture) {
      if (eventName === 'message') {
        postMessageCallback = callback;
      } else {
        originalAddEventListener(eventName, callback, useCapture);
      }
    };
    global.postMessage = function(messageKey, targetOrigin) {
      const postMessageEvent = {source: window, data: messageKey};
      if (postMessageCallback) {
        postMessageCallback(postMessageEvent);
      }
    };
    jest.resetModules();
    container = document.createElement('div');
    ReactDOM = require('react-dom');

    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders synchronously by default', () => {
    const ops = [];
    ReactDOM.render(<div>Hi</div>, container, () => {
      ops.push(container.textContent);
    });
    ReactDOM.render(<div>Bye</div>, container, () => {
      ops.push(container.textContent);
    });
    expect(ops).toEqual(['Hi', 'Bye']);
  });

  it('does not perform deferred updates synchronously', () => {
    let inputRef = React.createRef();
    let asyncValueRef = React.createRef();
    let syncValueRef = React.createRef();

    class Counter extends React.Component {
      state = {asyncValue: '', syncValue: ''};

      handleChange = e => {
        const nextValue = e.target.value;
        requestIdleCallback(() => {
          this.setState({
            asyncValue: nextValue,
          });
          // It should not be flushed yet.
          expect(asyncValueRef.current.textContent).toBe('');
        });
        this.setState({
          syncValue: nextValue,
        });
      };

      render() {
        return (
          <div>
            <input
              ref={inputRef}
              onChange={this.handleChange}
              defaultValue=""
            />
            <p ref={asyncValueRef}>{this.state.asyncValue}</p>
            <p ref={syncValueRef}>{this.state.syncValue}</p>
          </div>
        );
      }
    }
    ReactDOM.render(
      <AsyncMode>
        <Counter />
      </AsyncMode>,
      container,
    );
    expect(asyncValueRef.current.textContent).toBe('');
    expect(syncValueRef.current.textContent).toBe('');

    setUntrackedInputValue.call(inputRef.current, 'hello');
    inputRef.current.dispatchEvent(new MouseEvent('input', {bubbles: true}));
    // Should only flush non-deferred update.
    expect(asyncValueRef.current.textContent).toBe('');
    expect(syncValueRef.current.textContent).toBe('hello');

    // Should flush both updates now.
    jest.runAllTimers();
    expect(asyncValueRef.current.textContent).toBe('hello');
    expect(syncValueRef.current.textContent).toBe('hello');
  });

  describe('with feature flag disabled', () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactDOM = require('react-dom');
    });

    it('renders synchronously', () => {
      ReactDOM.render(
        <AsyncMode>
          <div>Hi</div>
        </AsyncMode>,
        container,
      );
      expect(container.textContent).toEqual('Hi');

      ReactDOM.render(
        <AsyncMode>
          <div>Bye</div>
        </AsyncMode>,
        container,
      );
      expect(container.textContent).toEqual('Bye');
    });
  });

  describe('with feature flag enabled', () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
      ReactDOM = require('react-dom');
    });

    it('createRoot makes the entire tree async', () => {
      const root = ReactDOM.unstable_createRoot(container);
      root.render(<div>Hi</div>);
      expect(container.textContent).toEqual('');
      jest.runAllTimers();
      expect(container.textContent).toEqual('Hi');

      root.render(<div>Bye</div>);
      expect(container.textContent).toEqual('Hi');
      jest.runAllTimers();
      expect(container.textContent).toEqual('Bye');
    });

    it('updates inside an async tree are async by default', () => {
      let instance;
      class Component extends React.Component {
        state = {step: 0};
        render() {
          instance = this;
          return <div>{this.state.step}</div>;
        }
      }

      const root = ReactDOM.unstable_createRoot(container);
      root.render(<Component />);
      expect(container.textContent).toEqual('');
      jest.runAllTimers();
      expect(container.textContent).toEqual('0');

      instance.setState({step: 1});
      expect(container.textContent).toEqual('0');
      jest.runAllTimers();
      expect(container.textContent).toEqual('1');
    });

    it('AsyncMode creates an async subtree', () => {
      let instance;
      class Component extends React.Component {
        state = {step: 0};
        render() {
          instance = this;
          return <div>{this.state.step}</div>;
        }
      }

      ReactDOM.render(
        <AsyncMode>
          <Component />
        </AsyncMode>,
        container,
      );
      jest.runAllTimers();

      instance.setState({step: 1});
      expect(container.textContent).toEqual('0');
      jest.runAllTimers();
      expect(container.textContent).toEqual('1');
    });

    it('updates inside an async subtree are async by default', () => {
      let instance;
      class Child extends React.Component {
        state = {step: 0};
        render() {
          instance = this;
          return <div>{this.state.step}</div>;
        }
      }

      ReactDOM.render(
        <div>
          <AsyncMode>
            <Child />
          </AsyncMode>
        </div>,
        container,
      );
      jest.runAllTimers();

      instance.setState({step: 1});
      expect(container.textContent).toEqual('0');
      jest.runAllTimers();
      expect(container.textContent).toEqual('1');
    });

    it('flushSync batches sync updates and flushes them at the end of the batch', () => {
      let ops = [];
      let instance;

      class Component extends React.Component {
        state = {text: ''};
        push(val) {
          this.setState(state => ({text: state.text + val}));
        }
        componentDidUpdate() {
          ops.push(this.state.text);
        }
        render() {
          instance = this;
          return <span>{this.state.text}</span>;
        }
      }

      ReactDOM.render(<Component />, container);

      instance.push('A');
      expect(ops).toEqual(['A']);
      expect(container.textContent).toEqual('A');

      ReactDOM.flushSync(() => {
        instance.push('B');
        instance.push('C');
        // Not flushed yet
        expect(container.textContent).toEqual('A');
        expect(ops).toEqual(['A']);
      });
      expect(container.textContent).toEqual('ABC');
      expect(ops).toEqual(['A', 'ABC']);
      instance.push('D');
      expect(container.textContent).toEqual('ABCD');
      expect(ops).toEqual(['A', 'ABC', 'ABCD']);
    });

    it('flushSync flushes updates even if nested inside another flushSync', () => {
      let ops = [];
      let instance;

      class Component extends React.Component {
        state = {text: ''};
        push(val) {
          this.setState(state => ({text: state.text + val}));
        }
        componentDidUpdate() {
          ops.push(this.state.text);
        }
        render() {
          instance = this;
          return <span>{this.state.text}</span>;
        }
      }

      ReactDOM.render(<Component />, container);

      instance.push('A');
      expect(ops).toEqual(['A']);
      expect(container.textContent).toEqual('A');

      ReactDOM.flushSync(() => {
        instance.push('B');
        instance.push('C');
        // Not flushed yet
        expect(container.textContent).toEqual('A');
        expect(ops).toEqual(['A']);

        ReactDOM.flushSync(() => {
          instance.push('D');
        });
        // The nested flushSync caused everything to flush.
        expect(container.textContent).toEqual('ABCD');
        expect(ops).toEqual(['A', 'ABCD']);
      });
      expect(container.textContent).toEqual('ABCD');
      expect(ops).toEqual(['A', 'ABCD']);
    });

    it('flushSync throws if already performing work', () => {
      class Component extends React.Component {
        componentDidUpdate() {
          ReactDOM.flushSync(() => {});
        }
        render() {
          return null;
        }
      }

      // Initial mount
      ReactDOM.render(<Component />, container);
      // Update
      expect(() => ReactDOM.render(<Component />, container)).toThrow(
        'flushSync was called from inside a lifecycle method',
      );
    });

    it('flushSync flushes updates before end of the tick', () => {
      let ops = [];
      let instance;

      class Component extends React.Component {
        state = {text: ''};
        push(val) {
          this.setState(state => ({text: state.text + val}));
        }
        componentDidUpdate() {
          ops.push(this.state.text);
        }
        render() {
          instance = this;
          return <span>{this.state.text}</span>;
        }
      }

      ReactDOM.render(
        <AsyncMode>
          <Component />
        </AsyncMode>,
        container,
      );
      jest.runAllTimers();

      // Updates are async by default
      instance.push('A');
      expect(ops).toEqual([]);
      expect(container.textContent).toEqual('');

      ReactDOM.flushSync(() => {
        instance.push('B');
        instance.push('C');
        // Not flushed yet
        expect(container.textContent).toEqual('');
        expect(ops).toEqual([]);
      });
      // Only the active updates have flushed
      expect(container.textContent).toEqual('BC');
      expect(ops).toEqual(['BC']);

      instance.push('D');
      expect(container.textContent).toEqual('BC');
      expect(ops).toEqual(['BC']);

      // Flush the async updates
      jest.runAllTimers();
      expect(container.textContent).toEqual('ABCD');
      expect(ops).toEqual(['BC', 'ABCD']);
    });

    it('flushControlled flushes updates before yielding to browser', () => {
      let inst;
      class Counter extends React.Component {
        state = {counter: 0};
        increment = () =>
          this.setState(state => ({counter: state.counter + 1}));
        render() {
          inst = this;
          return this.state.counter;
        }
      }
      ReactDOM.render(
        <AsyncMode>
          <Counter />
        </AsyncMode>,
        container,
      );
      expect(container.textContent).toEqual('0');

      // Test that a normal update is async
      inst.increment();
      expect(container.textContent).toEqual('0');
      jest.runAllTimers();
      expect(container.textContent).toEqual('1');

      let ops = [];
      ReactDOM.unstable_flushControlled(() => {
        inst.increment();
        ReactDOM.unstable_flushControlled(() => {
          inst.increment();
          ops.push('end of inner flush: ' + container.textContent);
        });
        ops.push('end of outer flush: ' + container.textContent);
      });
      ops.push('after outer flush: ' + container.textContent);
      expect(ops).toEqual([
        'end of inner flush: 1',
        'end of outer flush: 1',
        'after outer flush: 3',
      ]);
    });

    it('flushControlled does not flush until end of outermost batchedUpdates', () => {
      let inst;
      class Counter extends React.Component {
        state = {counter: 0};
        increment = () =>
          this.setState(state => ({counter: state.counter + 1}));
        render() {
          inst = this;
          return this.state.counter;
        }
      }
      ReactDOM.render(<Counter />, container);

      let ops = [];
      ReactDOM.unstable_batchedUpdates(() => {
        inst.increment();
        ReactDOM.unstable_flushControlled(() => {
          inst.increment();
          ops.push('end of flushControlled fn: ' + container.textContent);
        });
        ops.push('end of batchedUpdates fn: ' + container.textContent);
      });
      ops.push('after batchedUpdates: ' + container.textContent);
      expect(ops).toEqual([
        'end of flushControlled fn: 0',
        'end of batchedUpdates fn: 0',
        'after batchedUpdates: 2',
      ]);
    });

    it('flushControlled returns nothing', () => {
      // In the future, we may want to return a thenable "work" object.
      let inst;
      class Counter extends React.Component {
        state = {counter: 0};
        increment = () =>
          this.setState(state => ({counter: state.counter + 1}));
        render() {
          inst = this;
          return this.state.counter;
        }
      }
      ReactDOM.render(<Counter />, container);
      expect(container.textContent).toEqual('0');

      const returnValue = ReactDOM.unstable_flushControlled(() => {
        inst.increment();
        return 'something';
      });
      expect(container.textContent).toEqual('1');
      expect(returnValue).toBe(undefined);
    });
  });
});
