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
const Fragment = React.Fragment;
let ReactFeatureFlags = require('shared/ReactFeatureFlags');

let ReactDOM;
let Scheduler;

const ConcurrentMode = React.unstable_ConcurrentMode;

const setUntrackedInputValue = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
).set;

describe('ReactDOMFiberAsync', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');

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
      <ConcurrentMode>
        <Counter />
      </ConcurrentMode>,
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
    Scheduler.flushAll();
    expect(asyncValueRef.current.textContent).toBe('hello');
    expect(syncValueRef.current.textContent).toBe('hello');
  });

  describe('with feature flag disabled', () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactDOM = require('react-dom');
      Scheduler = require('scheduler');
    });

    it('renders synchronously', () => {
      ReactDOM.render(
        <ConcurrentMode>
          <div>Hi</div>
        </ConcurrentMode>,
        container,
      );
      expect(container.textContent).toEqual('Hi');

      ReactDOM.render(
        <ConcurrentMode>
          <div>Bye</div>
        </ConcurrentMode>,
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
      Scheduler = require('scheduler');
    });

    it('createRoot makes the entire tree async', () => {
      const root = ReactDOM.unstable_createRoot(container);
      root.render(<div>Hi</div>);
      expect(container.textContent).toEqual('');
      Scheduler.flushAll();
      expect(container.textContent).toEqual('Hi');

      root.render(<div>Bye</div>);
      expect(container.textContent).toEqual('Hi');
      Scheduler.flushAll();
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
      Scheduler.flushAll();
      expect(container.textContent).toEqual('0');

      instance.setState({step: 1});
      expect(container.textContent).toEqual('0');
      Scheduler.flushAll();
      expect(container.textContent).toEqual('1');
    });

    it('ConcurrentMode creates an async subtree', () => {
      let instance;
      class Component extends React.Component {
        state = {step: 0};
        render() {
          instance = this;
          return <div>{this.state.step}</div>;
        }
      }

      ReactDOM.render(
        <ConcurrentMode>
          <Component />
        </ConcurrentMode>,
        container,
      );
      Scheduler.flushAll();

      instance.setState({step: 1});
      expect(container.textContent).toEqual('0');
      Scheduler.flushAll();
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
          <ConcurrentMode>
            <Child />
          </ConcurrentMode>
        </div>,
        container,
      );
      Scheduler.flushAll();

      instance.setState({step: 1});
      expect(container.textContent).toEqual('0');
      Scheduler.flushAll();
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
        <ConcurrentMode>
          <Component />
        </ConcurrentMode>,
        container,
      );
      Scheduler.flushAll();

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
      Scheduler.flushAll();
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
        <ConcurrentMode>
          <Counter />
        </ConcurrentMode>,
        container,
      );
      expect(container.textContent).toEqual('0');

      // Test that a normal update is async
      inst.increment();
      expect(container.textContent).toEqual('0');
      Scheduler.flushAll();
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

    it('ignores discrete events on a pending removed element', () => {
      const disableButtonRef = React.createRef();
      const submitButtonRef = React.createRef();

      let formSubmitted = false;

      class Form extends React.Component {
        state = {active: true};
        disableForm = () => {
          this.setState({active: false});
        };
        submitForm = () => {
          formSubmitted = true; // This should not get invoked
        };
        render() {
          return (
            <div>
              <button onClick={this.disableForm} ref={disableButtonRef}>
                Disable
              </button>
              {this.state.active ? (
                <button onClick={this.submitForm} ref={submitButtonRef}>
                  Submit
                </button>
              ) : null}
            </div>
          );
        }
      }

      const root = ReactDOM.unstable_createRoot(container);
      root.render(<Form />);
      // Flush
      Scheduler.flushAll();

      let disableButton = disableButtonRef.current;
      expect(disableButton.tagName).toBe('BUTTON');

      // Dispatch a click event on the Disable-button.
      let firstEvent = document.createEvent('Event');
      firstEvent.initEvent('click', true, true);
      disableButton.dispatchEvent(firstEvent);

      // There should now be a pending update to disable the form.

      // This should not have flushed yet since it's in concurrent mode.
      let submitButton = submitButtonRef.current;
      expect(submitButton.tagName).toBe('BUTTON');

      // In the meantime, we can dispatch a new client event on the submit button.
      let secondEvent = document.createEvent('Event');
      secondEvent.initEvent('click', true, true);
      // This should force the pending update to flush which disables the submit button before the event is invoked.
      submitButton.dispatchEvent(secondEvent);

      // Therefore the form should never have been submitted.
      expect(formSubmitted).toBe(false);

      expect(submitButtonRef.current).toBe(null);
    });

    it('ignores discrete events on a pending removed event listener', () => {
      const disableButtonRef = React.createRef();
      const submitButtonRef = React.createRef();

      let formSubmitted = false;

      class Form extends React.Component {
        state = {active: true};
        disableForm = () => {
          this.setState({active: false});
        };
        submitForm = () => {
          formSubmitted = true; // This should not get invoked
        };
        disabledSubmitForm = () => {
          // The form is disabled.
        };
        render() {
          return (
            <div>
              <button onClick={this.disableForm} ref={disableButtonRef}>
                Disable
              </button>
              <button
                onClick={
                  this.state.active ? this.submitForm : this.disabledSubmitForm
                }
                ref={submitButtonRef}>
                Submit
              </button>{' '}
              : null}
            </div>
          );
        }
      }

      const root = ReactDOM.unstable_createRoot(container);
      root.render(<Form />);
      // Flush
      Scheduler.flushAll();

      let disableButton = disableButtonRef.current;
      expect(disableButton.tagName).toBe('BUTTON');

      // Dispatch a click event on the Disable-button.
      let firstEvent = document.createEvent('Event');
      firstEvent.initEvent('click', true, true);
      disableButton.dispatchEvent(firstEvent);

      // There should now be a pending update to disable the form.

      // This should not have flushed yet since it's in concurrent mode.
      let submitButton = submitButtonRef.current;
      expect(submitButton.tagName).toBe('BUTTON');

      // In the meantime, we can dispatch a new client event on the submit button.
      let secondEvent = document.createEvent('Event');
      secondEvent.initEvent('click', true, true);
      // This should force the pending update to flush which disables the submit button before the event is invoked.
      submitButton.dispatchEvent(secondEvent);

      // Therefore the form should never have been submitted.
      expect(formSubmitted).toBe(false);
    });

    it('uses the newest discrete events on a pending changed event listener', () => {
      const enableButtonRef = React.createRef();
      const submitButtonRef = React.createRef();

      let formSubmitted = false;

      class Form extends React.Component {
        state = {active: false};
        enableForm = () => {
          this.setState({active: true});
        };
        submitForm = () => {
          formSubmitted = true; // This should happen
        };
        render() {
          return (
            <div>
              <button onClick={this.enableForm} ref={enableButtonRef}>
                Enable
              </button>
              <button
                onClick={this.state.active ? this.submitForm : null}
                ref={submitButtonRef}>
                Submit
              </button>{' '}
              : null}
            </div>
          );
        }
      }

      const root = ReactDOM.unstable_createRoot(container);
      root.render(<Form />);
      // Flush
      Scheduler.flushAll();

      let enableButton = enableButtonRef.current;
      expect(enableButton.tagName).toBe('BUTTON');

      // Dispatch a click event on the Enable-button.
      let firstEvent = document.createEvent('Event');
      firstEvent.initEvent('click', true, true);
      enableButton.dispatchEvent(firstEvent);

      // There should now be a pending update to enable the form.

      // This should not have flushed yet since it's in concurrent mode.
      let submitButton = submitButtonRef.current;
      expect(submitButton.tagName).toBe('BUTTON');

      // In the meantime, we can dispatch a new client event on the submit button.
      let secondEvent = document.createEvent('Event');
      secondEvent.initEvent('click', true, true);
      // This should force the pending update to flush which enables the submit button before the event is invoked.
      submitButton.dispatchEvent(secondEvent);

      // Therefore the form should have been submitted.
      expect(formSubmitted).toBe(true);
    });
  });

  describe('Disable yielding', () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.disableYielding = true;
      ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
      ReactDOM = require('react-dom');
      Scheduler = require('scheduler');
    });

    it('wont yield during a render if yielding is disabled', () => {
      class A extends React.Component {
        render() {
          Scheduler.yieldValue('A');
          return <div>{this.props.children}</div>;
        }
      }

      class B extends React.Component {
        render() {
          Scheduler.yieldValue('B');
          return <div>{this.props.children}</div>;
        }
      }

      class C extends React.Component {
        render() {
          Scheduler.yieldValue('C');
          return <div>{this.props.children}</div>;
        }
      }

      let root = ReactDOM.unstable_createRoot(container);

      root.render(
        <Fragment>
          <A />
          <B />
          <C />
        </Fragment>,
      );

      expect(Scheduler).toHaveYielded([]);

      Scheduler.unstable_flushNumberOfYields(2);
      // Even though we just flushed two yields, we should have rendered
      // everything without yielding when the flag is on.
      expect(Scheduler).toHaveYielded(['A', 'B', 'C']);
    });

    it('wont suspend during a render if yielding is disabled', () => {
      let p = new Promise(resolve => {});

      function Suspend() {
        throw p;
      }

      let root = ReactDOM.unstable_createRoot(container);
      root.render(
        <React.Suspense fallback={'Loading'}>Initial</React.Suspense>,
      );

      Scheduler.flushAll();
      expect(container.textContent).toBe('Initial');

      root.render(
        <React.Suspense fallback={'Loading'}>
          <Suspend />
        </React.Suspense>,
      );

      expect(Scheduler).toHaveYielded([]);

      Scheduler.flushAll();

      // This should have flushed to the DOM even though we haven't ran the timers.
      expect(container.textContent).toBe('Loading');
    });
  });
});
