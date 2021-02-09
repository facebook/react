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
let Scheduler;

describe('ReactDOMNativeEventHeuristic-test', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    container = document.createElement('div');
    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');

    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  // @gate experimental
  it('ignores discrete events on a pending removed element', () => {
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
      return (
        <div>
          <button onClick={disableForm} ref={disableButtonRef}>
            Disable
          </button>
          {active ? (
            <button onClick={submitForm} ref={submitButtonRef}>
              Submit
            </button>
          ) : null}
        </div>
      );
    }

    const root = ReactDOM.unstable_createRoot(container);
    root.render(<Form />);
    // Flush
    Scheduler.unstable_flushAll();

    const disableButton = disableButtonRef.current;
    expect(disableButton.tagName).toBe('BUTTON');

    // Dispatch a click event on the Disable-button.
    const firstEvent = document.createEvent('Event');
    firstEvent.initEvent('click', true, true);
    disableButton.dispatchEvent(firstEvent);

    // There should now be a pending update to disable the form.

    // This should not have flushed yet since it's in concurrent mode.
    const submitButton = submitButtonRef.current;
    expect(submitButton.tagName).toBe('BUTTON');

    // In the meantime, we can dispatch a new client event on the submit button.
    const secondEvent = document.createEvent('Event');
    secondEvent.initEvent('click', true, true);
    // This should force the pending update to flush which disables the submit button before the event is invoked.
    submitButton.dispatchEvent(secondEvent);

    // Therefore the form should never have been submitted.
    expect(formSubmitted).toBe(false);

    expect(submitButtonRef.current).toBe(null);
  });

  // @gate experimental
  it('ignores discrete events on a pending removed event listener', () => {
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

    const root = ReactDOM.unstable_createRoot(container);
    root.render(<Form />);
    // Flush
    Scheduler.unstable_flushAll();

    const disableButton = disableButtonRef.current;
    expect(disableButton.tagName).toBe('BUTTON');

    // Dispatch a click event on the Disable-button.
    const firstEvent = document.createEvent('Event');
    firstEvent.initEvent('click', true, true);
    disableButton.dispatchEvent(firstEvent);

    // There should now be a pending update to disable the form.

    // This should not have flushed yet since it's in concurrent mode.
    const submitButton = submitButtonRef.current;
    expect(submitButton.tagName).toBe('BUTTON');

    // In the meantime, we can dispatch a new client event on the submit button.
    const secondEvent = document.createEvent('Event');
    secondEvent.initEvent('click', true, true);
    // This should force the pending update to flush which disables the submit button before the event is invoked.
    submitButton.dispatchEvent(secondEvent);

    // Therefore the form should never have been submitted.
    expect(formSubmitted).toBe(false);
  });

  // @gate experimental
  it('uses the newest discrete events on a pending changed event listener', () => {
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

    const root = ReactDOM.unstable_createRoot(container);
    root.render(<Form />);
    // Flush
    Scheduler.unstable_flushAll();

    const enableButton = enableButtonRef.current;
    expect(enableButton.tagName).toBe('BUTTON');

    // Dispatch a click event on the Enable-button.
    const firstEvent = document.createEvent('Event');
    firstEvent.initEvent('click', true, true);
    enableButton.dispatchEvent(firstEvent);

    // There should now be a pending update to enable the form.

    // This should not have flushed yet since it's in concurrent mode.
    const submitButton = submitButtonRef.current;
    expect(submitButton.tagName).toBe('BUTTON');

    // In the meantime, we can dispatch a new client event on the submit button.
    const secondEvent = document.createEvent('Event');
    secondEvent.initEvent('click', true, true);
    // This should force the pending update to flush which enables the submit button before the event is invoked.
    submitButton.dispatchEvent(secondEvent);

    // Therefore the form should have been submitted.
    expect(formSubmitted).toBe(true);
  });
});
