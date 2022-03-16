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

let ReactDOM;
let ReactDOMClient;
let Scheduler;
let act;

describe('ReactDOMNativeEventHeuristic-test', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
    act = require('jest-react').act;

    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function dispatchAndSetCurrentEvent(el, event) {
    try {
      window.event = event;
      el.dispatchEvent(event);
    } finally {
      window.event = undefined;
    }
  }

  it('ignores discrete events on a pending removed element', async () => {
    const disableButtonRef = React.createRef();
    const submitButtonRef = React.createRef();

    function Form() {
      const [active, setActive] = React.useState(true);

      React.useLayoutEffect(() => {
        disableButtonRef.current.onclick = disableForm;
      });

      function disableForm() {
        setActive(false);
      }

      return (
        <div>
          <button ref={disableButtonRef}>Disable</button>
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

    // Dispatch a click event on the Disable-button.
    const firstEvent = document.createEvent('Event');
    firstEvent.initEvent('click', true, true);
    dispatchAndSetCurrentEvent(disableButton, firstEvent);

    // Discrete events should be flushed in a microtask.
    // Verify that the second button was removed.
    await null;
    expect(submitButtonRef.current).toBe(null);
    // We'll assume that the browser won't let the user click it.
  });

  it('ignores discrete events on a pending removed event listener', async () => {
    const disableButtonRef = React.createRef();
    const submitButtonRef = React.createRef();

    let formSubmitted = false;

    function Form() {
      const [active, setActive] = React.useState(true);

      React.useLayoutEffect(() => {
        disableButtonRef.current.onclick = disableForm;
        submitButtonRef.current.onclick = active
          ? submitForm
          : disabledSubmitForm;
      });

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
          <button ref={disableButtonRef}>Disable</button>
          <button ref={submitButtonRef}>Submit</button>
        </div>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    root.render(<Form />);
    // Flush
    Scheduler.unstable_flushAll();

    const disableButton = disableButtonRef.current;
    expect(disableButton.tagName).toBe('BUTTON');

    // Dispatch a click event on the Disable-button.
    const firstEvent = document.createEvent('Event');
    firstEvent.initEvent('click', true, true);
    dispatchAndSetCurrentEvent(disableButton, firstEvent);

    // There should now be a pending update to disable the form.
    // This should not have flushed yet since it's in concurrent mode.
    const submitButton = submitButtonRef.current;
    expect(submitButton.tagName).toBe('BUTTON');

    // Discrete events should be flushed in a microtask.
    await null;

    // Now let's dispatch an event on the submit button.
    const secondEvent = document.createEvent('Event');
    secondEvent.initEvent('click', true, true);
    dispatchAndSetCurrentEvent(submitButton, secondEvent);

    // Therefore the form should never have been submitted.
    expect(formSubmitted).toBe(false);
  });

  it('uses the newest discrete events on a pending changed event listener', async () => {
    const enableButtonRef = React.createRef();
    const submitButtonRef = React.createRef();

    let formSubmitted = false;

    function Form() {
      const [active, setActive] = React.useState(false);

      React.useLayoutEffect(() => {
        enableButtonRef.current.onclick = enableForm;
        submitButtonRef.current.onclick = active ? submitForm : null;
      });

      function enableForm() {
        setActive(true);
      }

      function submitForm() {
        formSubmitted = true; // This should not get invoked
      }

      return (
        <div>
          <button ref={enableButtonRef}>Enable</button>
          <button ref={submitButtonRef}>Submit</button>
        </div>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    root.render(<Form />);
    // Flush
    Scheduler.unstable_flushAll();

    const enableButton = enableButtonRef.current;
    expect(enableButton.tagName).toBe('BUTTON');

    // Dispatch a click event on the Enable-button.
    const firstEvent = document.createEvent('Event');
    firstEvent.initEvent('click', true, true);
    dispatchAndSetCurrentEvent(enableButton, firstEvent);

    // There should now be a pending update to enable the form.
    // This should not have flushed yet since it's in concurrent mode.
    const submitButton = submitButtonRef.current;
    expect(submitButton.tagName).toBe('BUTTON');

    // Discrete events should be flushed in a microtask.
    await null;

    // Now let's dispatch an event on the submit button.
    const secondEvent = document.createEvent('Event');
    secondEvent.initEvent('click', true, true);
    dispatchAndSetCurrentEvent(submitButton, secondEvent);

    // Therefore the form should have been submitted.
    expect(formSubmitted).toBe(true);
  });

  it('mouse over should be user-blocking but not discrete', async () => {
    const root = ReactDOMClient.createRoot(container);

    const target = React.createRef(null);
    function Foo() {
      const [isHover, setHover] = React.useState(false);
      React.useLayoutEffect(() => {
        target.current.onmouseover = () => setHover(true);
      });
      return <div ref={target}>{isHover ? 'hovered' : 'not hovered'}</div>;
    }

    await act(async () => {
      root.render(<Foo />);
    });
    expect(container.textContent).toEqual('not hovered');

    await act(async () => {
      const mouseOverEvent = document.createEvent('MouseEvents');
      mouseOverEvent.initEvent('mouseover', true, true);
      dispatchAndSetCurrentEvent(target.current, mouseOverEvent);

      // Flush discrete updates
      ReactDOM.flushSync();
      // Since mouse over is not discrete, should not have updated yet
      expect(container.textContent).toEqual('not hovered');
    });
    expect(container.textContent).toEqual('hovered');
  });

  it('mouse enter should be user-blocking but not discrete', async () => {
    const root = ReactDOMClient.createRoot(container);

    const target = React.createRef(null);
    function Foo() {
      const [isHover, setHover] = React.useState(false);
      React.useLayoutEffect(() => {
        target.current.onmouseenter = () => setHover(true);
      });
      return <div ref={target}>{isHover ? 'hovered' : 'not hovered'}</div>;
    }

    await act(async () => {
      root.render(<Foo />);
    });
    expect(container.textContent).toEqual('not hovered');

    await act(async () => {
      // Note: React does not use native mouseenter/mouseleave events
      // but we should still correctly determine their priority.
      const mouseEnterEvent = document.createEvent('MouseEvents');
      mouseEnterEvent.initEvent('mouseenter', true, true);
      dispatchAndSetCurrentEvent(target.current, mouseEnterEvent);

      // Flush discrete updates
      ReactDOM.flushSync();
      // Since mouse end is not discrete, should not have updated yet
      expect(container.textContent).toEqual('not hovered');
    });
    expect(container.textContent).toEqual('hovered');
  });

  it('continuous native events flush as expected', async () => {
    const root = ReactDOMClient.createRoot(container);

    const target = React.createRef(null);
    function Foo({hovered}) {
      const hoverString = hovered ? 'hovered' : 'not hovered';
      Scheduler.unstable_yieldValue(hoverString);
      return <div ref={target}>{hoverString}</div>;
    }

    await act(async () => {
      root.render(<Foo hovered={false} />);
    });
    expect(container.textContent).toEqual('not hovered');

    await act(async () => {
      // Note: React does not use native mouseenter/mouseleave events
      // but we should still correctly determine their priority.
      const mouseEnterEvent = document.createEvent('MouseEvents');
      mouseEnterEvent.initEvent('mouseover', true, true);
      target.current.addEventListener('mouseover', () => {
        root.render(<Foo hovered={true} />);
      });
      dispatchAndSetCurrentEvent(target.current, mouseEnterEvent);

      // Since mouse end is not discrete, should not have updated yet
      expect(Scheduler).toHaveYielded(['not hovered']);
      expect(container.textContent).toEqual('not hovered');

      expect(Scheduler).toFlushAndYieldThrough(['hovered']);
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        expect(container.textContent).toEqual('hovered');
      } else {
        expect(container.textContent).toEqual('not hovered');
      }
    });
    expect(container.textContent).toEqual('hovered');
  });

  it('should batch inside native events', async () => {
    const root = ReactDOMClient.createRoot(container);

    const target = React.createRef(null);
    function Foo() {
      const [count, setCount] = React.useState(0);
      const countRef = React.useRef(-1);

      React.useLayoutEffect(() => {
        countRef.current = count;
        target.current.onclick = () => {
          setCount(countRef.current + 1);
          // Now update again. If these updates are batched, then this should be
          // a no-op, because we didn't re-render yet and `countRef` hasn't
          // been mutated.
          setCount(countRef.current + 1);
        };
      });
      return <div ref={target}>Count: {count}</div>;
    }

    await act(async () => {
      root.render(<Foo />);
    });
    expect(container.textContent).toEqual('Count: 0');

    const pressEvent = document.createEvent('Event');
    pressEvent.initEvent('click', true, true);
    dispatchAndSetCurrentEvent(target.current, pressEvent);
    // Intentionally not using `act` so we can observe in between the press
    // event and the microtask, without batching.
    await null;
    // If this is 2, that means the `setCount` calls were not batched.
    expect(container.textContent).toEqual('Count: 1');
  });

  it('should not flush discrete events at the end of outermost batchedUpdates', async () => {
    const root = ReactDOMClient.createRoot(container);

    let target;
    function Foo() {
      const [count, setCount] = React.useState(0);
      return (
        <div
          ref={el => {
            target = el;
            if (target !== null) {
              el.onclick = () => {
                ReactDOM.unstable_batchedUpdates(() => {
                  setCount(count + 1);
                });
                Scheduler.unstable_yieldValue(
                  container.textContent + ' [after batchedUpdates]',
                );
              };
            }
          }}>
          Count: {count}
        </div>
      );
    }

    await act(async () => {
      root.render(<Foo />);
    });
    expect(container.textContent).toEqual('Count: 0');

    const pressEvent = document.createEvent('Event');
    pressEvent.initEvent('click', true, true);
    dispatchAndSetCurrentEvent(target, pressEvent);

    expect(Scheduler).toHaveYielded(['Count: 0 [after batchedUpdates]']);
    expect(container.textContent).toEqual('Count: 0');

    // Intentionally not using `act` so we can observe in between the click
    // event and the microtask, without batching.
    await null;

    expect(container.textContent).toEqual('Count: 1');
  });
});
