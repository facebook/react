/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

global.IS_REACT_ACT_ENVIRONMENT = true;

// Our current version of JSDOM doesn't implement the event dispatching
// so we polyfill it.
const NativeFormData = global.FormData;
const FormDataPolyfill = function FormData(form) {
  const formData = new NativeFormData(form);
  const formDataEvent = new Event('formdata', {
    bubbles: true,
    cancelable: false,
  });
  formDataEvent.formData = formData;
  form.dispatchEvent(formDataEvent);
  return formData;
};
NativeFormData.prototype.constructor = FormDataPolyfill;
global.FormData = FormDataPolyfill;

describe('ReactDOMForm', () => {
  let act;
  let container;
  let React;
  let ReactDOM;
  let ReactDOMClient;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function submit(submitter) {
    const form = submitter.form || submitter;
    if (!submitter.form) {
      submitter = undefined;
    }
    const submitEvent = new Event('submit', {bubbles: true, cancelable: true});
    submitEvent.submitter = submitter;
    const returnValue = form.dispatchEvent(submitEvent);
    if (!returnValue) {
      return;
    }
    const action =
      (submitter && submitter.getAttribute('formaction')) || form.action;
    if (!/\s*javascript:/i.test(action)) {
      throw new Error('Navigate to: ' + action);
    }
  }

  // @gate enableFormActions
  it('should allow passing a function to form action', async () => {
    const ref = React.createRef();
    let foo;

    function action(formData) {
      foo = formData.get('foo');
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(
        <form action={action} ref={ref}>
          <input type="text" name="foo" defaultValue="bar" />
        </form>,
      );
    });

    submit(ref.current);

    expect(foo).toBe('bar');

    // Try updating the action

    function action2(formData) {
      foo = formData.get('foo') + '2';
    }

    await act(async () => {
      root.render(
        <form action={action2} ref={ref}>
          <input type="text" name="foo" defaultValue="bar" />
        </form>,
      );
    });

    submit(ref.current);

    expect(foo).toBe('bar2');
  });

  // @gate enableFormActions
  it('should allow passing a function to an input/button formAction', async () => {
    const inputRef = React.createRef();
    const buttonRef = React.createRef();
    let rootActionCalled = false;
    let savedTitle = null;
    let deletedTitle = null;

    function action(formData) {
      rootActionCalled = true;
    }

    function saveItem(formData) {
      savedTitle = formData.get('title');
    }

    function deleteItem(formData) {
      deletedTitle = formData.get('title');
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(
        <form action={action}>
          <input type="text" name="title" defaultValue="Hello" />
          <input
            type="submit"
            formAction={saveItem}
            value="Save"
            ref={inputRef}
          />
          <button formAction={deleteItem} ref={buttonRef}>
            Delete
          </button>
        </form>,
      );
    });

    expect(savedTitle).toBe(null);
    expect(deletedTitle).toBe(null);

    submit(inputRef.current);
    expect(savedTitle).toBe('Hello');
    expect(deletedTitle).toBe(null);
    savedTitle = null;

    submit(buttonRef.current);
    expect(savedTitle).toBe(null);
    expect(deletedTitle).toBe('Hello');
    deletedTitle = null;

    // Try updating the actions

    function saveItem2(formData) {
      savedTitle = formData.get('title') + '2';
    }

    function deleteItem2(formData) {
      deletedTitle = formData.get('title') + '2';
    }

    await act(async () => {
      root.render(
        <form action={action}>
          <input type="text" name="title" defaultValue="Hello" />
          <input
            type="submit"
            formAction={saveItem2}
            value="Save"
            ref={inputRef}
          />
          <button formAction={deleteItem2} ref={buttonRef}>
            Delete
          </button>
        </form>,
      );
    });

    expect(savedTitle).toBe(null);
    expect(deletedTitle).toBe(null);

    submit(inputRef.current);
    expect(savedTitle).toBe('Hello2');
    expect(deletedTitle).toBe(null);
    savedTitle = null;

    submit(buttonRef.current);
    expect(savedTitle).toBe(null);
    expect(deletedTitle).toBe('Hello2');

    expect(rootActionCalled).toBe(false);
  });

  // @gate enableFormActions || !__DEV__
  it('should allow preventing default to block the action', async () => {
    const ref = React.createRef();
    let actionCalled = false;

    function action(formData) {
      actionCalled = true;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(
        <form action={action} ref={ref} onSubmit={e => e.preventDefault()}>
          <input type="text" name="foo" defaultValue="bar" />
        </form>,
      );
    });

    submit(ref.current);

    expect(actionCalled).toBe(false);
  });

  // @gate enableFormActions
  it('should only submit the inner of nested forms', async () => {
    const ref = React.createRef();
    let data;

    function outerAction(formData) {
      data = formData.get('data') + 'outer';
    }
    function innerAction(formData) {
      data = formData.get('data') + 'inner';
    }

    const root = ReactDOMClient.createRoot(container);
    await expect(async () => {
      await act(async () => {
        // This isn't valid HTML but just in case.
        root.render(
          <form action={outerAction}>
            <input type="text" name="data" defaultValue="outer" />
            <form action={innerAction} ref={ref}>
              <input type="text" name="data" defaultValue="inner" />
            </form>
          </form>,
        );
      });
    }).toErrorDev([
      'Warning: validateDOMNesting(...): <form> cannot appear as a descendant of <form>.' +
        '\n    in form (at **)' +
        '\n    in form (at **)',
    ]);

    submit(ref.current);

    expect(data).toBe('innerinner');
  });

  // @gate enableFormActions
  it('should only submit once if one root is nested inside the other', async () => {
    const ref = React.createRef();
    let outerCalled = 0;
    let innerCalled = 0;
    let bubbledSubmit = false;

    function outerAction(formData) {
      outerCalled++;
    }

    function innerAction(formData) {
      innerCalled++;
    }

    const innerContainerRef = React.createRef();
    const outerRoot = ReactDOMClient.createRoot(container);
    await act(async () => {
      outerRoot.render(
        // Nesting forms isn't valid HTML but just in case.
        <div onSubmit={() => (bubbledSubmit = true)}>
          <form action={outerAction}>
            <div ref={innerContainerRef} />
          </form>
        </div>,
      );
    });

    const innerRoot = ReactDOMClient.createRoot(innerContainerRef.current);
    await act(async () => {
      innerRoot.render(
        <form action={innerAction} ref={ref}>
          <input type="text" name="data" defaultValue="inner" />
        </form>,
      );
    });

    submit(ref.current);

    expect(bubbledSubmit).toBe(true);
    expect(outerCalled).toBe(0);
    expect(innerCalled).toBe(1);
  });

  // @gate enableFormActions
  it('should only submit once if a portal is nested inside its own root', async () => {
    const ref = React.createRef();
    let outerCalled = 0;
    let innerCalled = 0;
    let bubbledSubmit = false;

    function outerAction(formData) {
      outerCalled++;
    }

    function innerAction(formData) {
      innerCalled++;
    }

    const innerContainer = document.createElement('div');
    const innerContainerRef = React.createRef();
    const outerRoot = ReactDOMClient.createRoot(container);
    await act(async () => {
      outerRoot.render(
        // Nesting forms isn't valid HTML but just in case.
        <div onSubmit={() => (bubbledSubmit = true)}>
          <form action={outerAction}>
            <div ref={innerContainerRef} />
            {ReactDOM.createPortal(
              <form action={innerAction} ref={ref}>
                <input type="text" name="data" defaultValue="inner" />
              </form>,
              innerContainer,
            )}
          </form>
        </div>,
      );
    });

    innerContainerRef.current.appendChild(innerContainer);

    submit(ref.current);

    expect(bubbledSubmit).toBe(true);
    expect(outerCalled).toBe(0);
    expect(innerCalled).toBe(1);
  });

  // @gate enableFormActions
  it('can read the clicked button in the formdata event', async () => {
    const ref = React.createRef();
    let button;
    let title;

    function action(formData) {
      button = formData.get('button');
      title = formData.get('title');
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(
        // TODO: Test button element too.
        <form action={action}>
          <input type="text" name="title" defaultValue="hello" />
          <input type="submit" name="button" value="save" />
          <input type="submit" name="button" value="delete" ref={ref} />
        </form>,
      );
    });

    container.addEventListener('formdata', e => {
      // Process in the formdata event somehow
      if (e.formData.get('button') === 'delete') {
        e.formData.delete('title');
      }
    });

    submit(ref.current);

    expect(button).toBe('delete');
    expect(title).toBe(null);
  });

  // @gate enableFormActions || !__DEV__
  it('allows a non-function formaction to override a function one', async () => {
    const ref = React.createRef();
    let actionCalled = false;

    function action(formData) {
      actionCalled = true;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(
        <form action={action}>
          <input
            type="submit"
            formAction="http://example.com/submit"
            ref={ref}
          />
        </form>,
      );
    });

    let nav;
    try {
      submit(ref.current);
    } catch (x) {
      nav = x.message;
    }
    expect(nav).toBe('Navigate to: http://example.com/submit');
    expect(actionCalled).toBe(false);
  });

  // @gate enableFormActions || !__DEV__
  it('allows a non-react html formaction to be invoked', async () => {
    let actionCalled = false;

    function action(formData) {
      actionCalled = true;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(
        <form
          action={action}
          dangerouslySetInnerHTML={{
            __html: `
            <input
              type="submit"
              formAction="http://example.com/submit"
            />
          `,
          }}
        />,
      );
    });

    const node = container.getElementsByTagName('input')[0];
    let nav;
    try {
      submit(node);
    } catch (x) {
      nav = x.message;
    }
    expect(nav).toBe('Navigate to: http://example.com/submit');
    expect(actionCalled).toBe(false);
  });
});
