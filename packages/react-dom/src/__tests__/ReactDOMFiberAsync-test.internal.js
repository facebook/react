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
let Scheduler;

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
    const root = ReactDOM.unstable_createRoot(container);
    root.render(<Counter />);
    Scheduler.unstable_flushAll();
    expect(asyncValueRef.current.textContent).toBe('');
    expect(syncValueRef.current.textContent).toBe('');

    setUntrackedInputValue.call(inputRef.current, 'hello');
    inputRef.current.dispatchEvent(new MouseEvent('input', {bubbles: true}));
    // Should only flush non-deferred update.
    expect(asyncValueRef.current.textContent).toBe('');
    expect(syncValueRef.current.textContent).toBe('hello');

    // Should flush both updates now.
    jest.runAllTimers();
    Scheduler.unstable_flushAll();
    expect(asyncValueRef.current.textContent).toBe('hello');
    expect(syncValueRef.current.textContent).toBe('hello');
  });

  describe('concurrent mode', () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
      ReactDOM = require('react-dom');
      Scheduler = require('scheduler');
    });

    it('top-level updates are concurrent', () => {
      const root = ReactDOM.unstable_createRoot(container);
      root.render(<div>Hi</div>);
      expect(container.textContent).toEqual('');
      Scheduler.unstable_flushAll();
      expect(container.textContent).toEqual('Hi');

      root.render(<div>Bye</div>);
      expect(container.textContent).toEqual('Hi');
      Scheduler.unstable_flushAll();
      expect(container.textContent).toEqual('Bye');
    });

    it('deep updates (setState) are oncurrent', () => {
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
      Scheduler.unstable_flushAll();
      expect(container.textContent).toEqual('0');

      instance.setState({step: 1});
      expect(container.textContent).toEqual('0');
      Scheduler.unstable_flushAll();
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

      const root = ReactDOM.unstable_createRoot(container);
      root.render(<Component />);
      Scheduler.unstable_flushAll();

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
      Scheduler.unstable_flushAll();
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
      const root = ReactDOM.unstable_createRoot(container);
      root.render(<Counter />);
      Scheduler.unstable_flushAll();
      expect(container.textContent).toEqual('0');

      // Test that a normal update is async
      inst.increment();
      expect(container.textContent).toEqual('0');
      Scheduler.unstable_flushAll();
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
      Scheduler.unstable_flushAll();

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
      Scheduler.unstable_flushAll();

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
      Scheduler.unstable_flushAll();

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

  describe('createSyncRoot', () => {
    it('updates flush without yielding in the next event', () => {
      const root = ReactDOM.unstable_createSyncRoot(container);

      function Text(props) {
        Scheduler.unstable_yieldValue(props.text);
        return props.text;
      }

      root.render(
        <React.Fragment>
          <Text text="A" />
          <Text text="B" />
          <Text text="C" />
        </React.Fragment>,
      );

      // Nothing should have rendered yet
      expect(container.textContent).toEqual('');

      // Everything should render immediately in the next event
      expect(Scheduler).toFlushExpired(['A', 'B', 'C']);
      expect(container.textContent).toEqual('ABC');
    });

    it('does not support createBatch', () => {
      const root = ReactDOM.unstable_createSyncRoot(container);
      expect(root.createBatch).toBe(undefined);
    });
  });
});
