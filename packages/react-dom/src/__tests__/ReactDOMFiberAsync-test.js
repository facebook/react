/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;

let ReactDOM;
let ReactDOMClient;
let Scheduler;
let act;
let waitForAll;
let assertLog;

const setUntrackedInputValue = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value',
).set;

describe('ReactDOMFiberAsync', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
    Scheduler = require('scheduler');

    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
    assertLog = InternalTestUtils.assertLog;

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

  it('flushSync batches sync updates and flushes them at the end of the batch', () => {
    const ops = [];
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
    const ops = [];
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

  it('flushSync logs an error if already performing work', () => {
    class Component extends React.Component {
      componentDidUpdate() {
        ReactDOM.flushSync();
      }
      render() {
        return null;
      }
    }

    // Initial mount
    ReactDOM.render(<Component />, container);
    // Update
    expect(() => ReactDOM.render(<Component />, container)).toErrorDev(
      'flushSync was called from inside a lifecycle method',
    );
  });

  describe('concurrent mode', () => {
    it('does not perform deferred updates synchronously', async () => {
      const inputRef = React.createRef();
      const asyncValueRef = React.createRef();
      const syncValueRef = React.createRef();

      class Counter extends React.Component {
        state = {asyncValue: '', syncValue: ''};

        handleChange = e => {
          const nextValue = e.target.value;
          React.startTransition(() => {
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
      const root = ReactDOMClient.createRoot(container);
      await act(() => root.render(<Counter />));
      expect(asyncValueRef.current.textContent).toBe('');
      expect(syncValueRef.current.textContent).toBe('');

      await act(() => {
        setUntrackedInputValue.call(inputRef.current, 'hello');
        inputRef.current.dispatchEvent(
          new MouseEvent('input', {bubbles: true}),
        );
        // Should only flush non-deferred update.
        expect(asyncValueRef.current.textContent).toBe('');
        expect(syncValueRef.current.textContent).toBe('hello');
      });

      // Should flush both updates now.
      expect(asyncValueRef.current.textContent).toBe('hello');
      expect(syncValueRef.current.textContent).toBe('hello');
    });

    it('top-level updates are concurrent', async () => {
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<div>Hi</div>);
        expect(container.textContent).toEqual('');
      });
      expect(container.textContent).toEqual('Hi');

      await act(() => {
        root.render(<div>Bye</div>);
        expect(container.textContent).toEqual('Hi');
      });
      expect(container.textContent).toEqual('Bye');
    });

    it('deep updates (setState) are concurrent', async () => {
      let instance;
      class Component extends React.Component {
        state = {step: 0};
        render() {
          instance = this;
          return <div>{this.state.step}</div>;
        }
      }

      const root = ReactDOMClient.createRoot(container);

      await act(() => {
        root.render(<Component />);
        expect(container.textContent).toEqual('');
      });
      expect(container.textContent).toEqual('0');

      await act(() => {
        instance.setState({step: 1});
        expect(container.textContent).toEqual('0');
      });
      expect(container.textContent).toEqual('1');
    });

    it('flushSync flushes updates before end of the tick', async () => {
      let instance;

      class Component extends React.Component {
        state = {text: ''};
        push(val) {
          this.setState(state => ({text: state.text + val}));
        }
        componentDidUpdate() {
          Scheduler.log(this.state.text);
        }
        render() {
          instance = this;
          return <span>{this.state.text}</span>;
        }
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => root.render(<Component />));

      // Updates are async by default
      instance.push('A');
      assertLog([]);
      expect(container.textContent).toEqual('');

      ReactDOM.flushSync(() => {
        instance.push('B');
        instance.push('C');
        // Not flushed yet
        expect(container.textContent).toEqual('');
        assertLog([]);
      });
      // Only the active updates have flushed
      if (gate(flags => flags.enableUnifiedSyncLane)) {
        expect(container.textContent).toEqual('ABC');
        assertLog(['ABC']);
      } else {
        expect(container.textContent).toEqual('BC');
        assertLog(['BC']);
      }

      await act(() => {
        instance.push('D');
        if (gate(flags => flags.enableUnifiedSyncLane)) {
          expect(container.textContent).toEqual('ABC');
        } else {
          expect(container.textContent).toEqual('BC');
        }
        assertLog([]);
      });
      assertLog(['ABCD']);
      expect(container.textContent).toEqual('ABCD');
    });

    it('ignores discrete events on a pending removed element', async () => {
      const disableButtonRef = React.createRef();
      const submitButtonRef = React.createRef();

      function Form() {
        const [active, setActive] = React.useState(true);
        function disableForm() {
          setActive(false);
        }

        return (
          <div>
            <button onClick={disableForm} ref={disableButtonRef}>
              Disable
            </button>
            {active ? <button ref={submitButtonRef}>Submit</button> : null}
          </div>
        );
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Form />);
      });

      const disableButton = disableButtonRef.current;
      expect(disableButton.tagName).toBe('BUTTON');

      const submitButton = submitButtonRef.current;
      expect(submitButton.tagName).toBe('BUTTON');

      // Dispatch a click event on the Disable-button.
      const firstEvent = document.createEvent('Event');
      firstEvent.initEvent('click', true, true);
      disableButton.dispatchEvent(firstEvent);

      // The click event is flushed synchronously, even in concurrent mode.
      expect(submitButton.current).toBe(undefined);
    });

    it('ignores discrete events on a pending removed event listener', async () => {
      const disableButtonRef = React.createRef();
      const submitButtonRef = React.createRef();

      let formSubmitted = false;

      function Form() {
        const [active, setActive] = React.useState(true);
        function disableForm() {
          setActive(false);
        }
        function submitForm() {
          formSubmitted = true; // This should not get invoked
        }
        function disabledSubmitForm() {
          // The form is disabled.
        }
        return (
          <div>
            <button onClick={disableForm} ref={disableButtonRef}>
              Disable
            </button>
            <button
              onClick={active ? submitForm : disabledSubmitForm}
              ref={submitButtonRef}>
              Submit
            </button>
          </div>
        );
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Form />);
      });

      const disableButton = disableButtonRef.current;
      expect(disableButton.tagName).toBe('BUTTON');

      // Dispatch a click event on the Disable-button.
      const firstEvent = document.createEvent('Event');
      firstEvent.initEvent('click', true, true);
      await act(() => {
        disableButton.dispatchEvent(firstEvent);
      });

      // There should now be a pending update to disable the form.

      // This should not have flushed yet since it's in concurrent mode.
      const submitButton = submitButtonRef.current;
      expect(submitButton.tagName).toBe('BUTTON');

      // In the meantime, we can dispatch a new client event on the submit button.
      const secondEvent = document.createEvent('Event');
      secondEvent.initEvent('click', true, true);
      // This should force the pending update to flush which disables the submit button before the event is invoked.
      await act(() => {
        submitButton.dispatchEvent(secondEvent);
      });

      // Therefore the form should never have been submitted.
      expect(formSubmitted).toBe(false);
    });

    it('uses the newest discrete events on a pending changed event listener', async () => {
      const enableButtonRef = React.createRef();
      const submitButtonRef = React.createRef();

      let formSubmitted = false;

      function Form() {
        const [active, setActive] = React.useState(false);
        function enableForm() {
          setActive(true);
        }
        function submitForm() {
          formSubmitted = true; // This should not get invoked
        }
        return (
          <div>
            <button onClick={enableForm} ref={enableButtonRef}>
              Enable
            </button>
            <button onClick={active ? submitForm : null} ref={submitButtonRef}>
              Submit
            </button>
          </div>
        );
      }

      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Form />);
      });

      const enableButton = enableButtonRef.current;
      expect(enableButton.tagName).toBe('BUTTON');

      // Dispatch a click event on the Enable-button.
      const firstEvent = document.createEvent('Event');
      firstEvent.initEvent('click', true, true);
      await act(() => {
        enableButton.dispatchEvent(firstEvent);
      });

      // There should now be a pending update to enable the form.

      // This should not have flushed yet since it's in concurrent mode.
      const submitButton = submitButtonRef.current;
      expect(submitButton.tagName).toBe('BUTTON');

      // In the meantime, we can dispatch a new client event on the submit button.
      const secondEvent = document.createEvent('Event');
      secondEvent.initEvent('click', true, true);
      // This should force the pending update to flush which enables the submit button before the event is invoked.
      await act(() => {
        submitButton.dispatchEvent(secondEvent);
      });

      // Therefore the form should have been submitted.
      expect(formSubmitted).toBe(true);
    });
  });

  it('regression test: does not drop passive effects across roots (#17066)', async () => {
    const {useState, useEffect} = React;

    function App({label}) {
      const [step, setStep] = useState(0);
      useEffect(() => {
        if (step < 3) {
          setStep(step + 1);
        }
      }, [step]);

      // The component should keep re-rendering itself until `step` is 3.
      return step === 3 ? 'Finished' : 'Unresolved';
    }

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');
    const containerC = document.createElement('div');

    await act(() => {
      ReactDOM.render(<App label="A" />, containerA);
      ReactDOM.render(<App label="B" />, containerB);
      ReactDOM.render(<App label="C" />, containerC);
    });

    expect(containerA.textContent).toEqual('Finished');
    expect(containerB.textContent).toEqual('Finished');
    expect(containerC.textContent).toEqual('Finished');
  });

  it('updates flush without yielding in the next event', async () => {
    const root = ReactDOMClient.createRoot(container);

    function Text(props) {
      Scheduler.log(props.text);
      return props.text;
    }

    root.render(
      <>
        <Text text="A" />
        <Text text="B" />
        <Text text="C" />
      </>,
    );

    // Nothing should have rendered yet
    expect(container.textContent).toEqual('');

    // Everything should render immediately in the next event
    await waitForAll(['A', 'B', 'C']);
    expect(container.textContent).toEqual('ABC');
  });

  it('unmounted roots should never clear newer root content from a container', async () => {
    const ref = React.createRef();

    function OldApp() {
      const [value, setValue] = React.useState('old');
      function hideOnClick() {
        // Schedule a discrete update.
        setValue('update');
        // Synchronously unmount this root.
        ReactDOM.flushSync(() => oldRoot.unmount());
      }
      return (
        <button onClick={hideOnClick} ref={ref}>
          {value}
        </button>
      );
    }

    function NewApp() {
      return <button ref={ref}>new</button>;
    }

    const oldRoot = ReactDOMClient.createRoot(container);
    await act(() => {
      oldRoot.render(<OldApp />);
    });

    // Invoke discrete event.
    ref.current.click();

    // The root should now be unmounted.
    expect(container.textContent).toBe('');

    // We can now render a new one.
    const newRoot = ReactDOMClient.createRoot(container);
    ReactDOM.flushSync(() => {
      newRoot.render(<NewApp />);
    });
    ref.current.click();

    expect(container.textContent).toBe('new');
  });
});
