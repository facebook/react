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
  let Scheduler;
  let assertLog;
  let useState;
  let Suspense;
  let startTransition;
  let textCache;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
    useState = React.useState;
    Suspense = React.Suspense;
    startTransition = React.startTransition;
    container = document.createElement('div');
    document.body.appendChild(container);

    textCache = new Map();
  });

  function resolveText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      const newRecord = {
        status: 'resolved',
        value: text,
      };
      textCache.set(text, newRecord);
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'resolved';
      record.value = text;
      thenable.pings.forEach(t => t());
    }
  }
  function resolveText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      const newRecord = {
        status: 'resolved',
        value: text,
      };
      textCache.set(text, newRecord);
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'resolved';
      record.value = text;
      thenable.pings.forEach(t => t());
    }
  }

  function readText(text) {
    const record = textCache.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          Scheduler.log(`Suspend! [${text}]`);
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return record.value;
      }
    } else {
      Scheduler.log(`Suspend! [${text}]`);
      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };

      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.set(text, newRecord);

      throw thenable;
    }
  }

  function getText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };
      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.set(text, newRecord);
      return thenable;
    } else {
      switch (record.status) {
        case 'pending':
          return record.value;
        case 'rejected':
          return Promise.reject(record.value);
        case 'resolved':
          return Promise.resolve(record.value);
      }
    }
  }

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  function AsyncText({text}) {
    readText(text);
    Scheduler.log(text);
    return text;
  }

  afterEach(() => {
    document.body.removeChild(container);
  });

  async function submit(submitter) {
    await act(() => {
      const form = submitter.form || submitter;
      if (!submitter.form) {
        submitter = undefined;
      }
      const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true,
      });
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
    });
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

    await submit(ref.current);

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

    await submit(ref.current);

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

    await submit(inputRef.current);
    expect(savedTitle).toBe('Hello');
    expect(deletedTitle).toBe(null);
    savedTitle = null;

    await submit(buttonRef.current);
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

    await submit(inputRef.current);
    expect(savedTitle).toBe('Hello2');
    expect(deletedTitle).toBe(null);
    savedTitle = null;

    await submit(buttonRef.current);
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

    await submit(ref.current);

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

    await submit(ref.current);

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

    await submit(ref.current);

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

    await submit(ref.current);

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

    await submit(ref.current);

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
      await submit(ref.current);
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
      await submit(node);
    } catch (x) {
      nav = x.message;
    }
    expect(nav).toBe('Navigate to: http://example.com/submit');
    expect(actionCalled).toBe(false);
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  it('form actions are transitions', async () => {
    const formRef = React.createRef();

    function App() {
      const [state, setState] = useState('Initial');
      return (
        <form action={() => setState('Updated')} ref={formRef}>
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text={state} />
          </Suspense>
        </form>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await resolveText('Initial');
    await act(() => root.render(<App />));
    assertLog(['Initial']);
    expect(container.textContent).toBe('Initial');

    // This should suspend because form actions are implicitly wrapped
    // in startTransition.
    await submit(formRef.current);
    assertLog(['Suspend! [Updated]', 'Loading...']);
    expect(container.textContent).toBe('Initial');

    await act(() => resolveText('Updated'));
    assertLog(['Updated']);
    expect(container.textContent).toBe('Updated');
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  it('multiple form actions', async () => {
    const formRef = React.createRef();

    function App() {
      const [state, setState] = useState(0);
      return (
        <form action={() => setState(n => n + 1)} ref={formRef}>
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text={'Count: ' + state} />
          </Suspense>
        </form>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await resolveText('Count: 0');
    await act(() => root.render(<App />));
    assertLog(['Count: 0']);
    expect(container.textContent).toBe('Count: 0');

    // Update
    await submit(formRef.current);
    assertLog(['Suspend! [Count: 1]', 'Loading...']);
    expect(container.textContent).toBe('Count: 0');

    await act(() => resolveText('Count: 1'));
    assertLog(['Count: 1']);
    expect(container.textContent).toBe('Count: 1');

    // Update again
    await submit(formRef.current);
    assertLog(['Suspend! [Count: 2]', 'Loading...']);
    expect(container.textContent).toBe('Count: 1');

    await act(() => resolveText('Count: 2'));
    assertLog(['Count: 2']);
    expect(container.textContent).toBe('Count: 2');
  });

  // @gate enableFormActions
  it('form actions can be asynchronous', async () => {
    const formRef = React.createRef();

    function App() {
      const [state, setState] = useState('Initial');
      return (
        <form
          action={async () => {
            Scheduler.log('Async action started');
            await getText('Wait');
            startTransition(() => setState('Updated'));
          }}
          ref={formRef}>
          <Suspense fallback={<Text text="Loading..." />}>
            <AsyncText text={state} />
          </Suspense>
        </form>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await resolveText('Initial');
    await act(() => root.render(<App />));
    assertLog(['Initial']);
    expect(container.textContent).toBe('Initial');

    await submit(formRef.current);
    assertLog(['Async action started']);

    await act(() => resolveText('Wait'));
    assertLog(['Suspend! [Updated]', 'Loading...']);
    expect(container.textContent).toBe('Initial');
  });

  it('sync errors in form actions can be captured by an error boundary', async () => {
    if (gate(flags => !(flags.enableFormActions && flags.enableAsyncActions))) {
      // TODO: Uncaught JSDOM errors fail the test after the scope has finished
      // so don't work with the `gate` mechanism.
      return;
    }

    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error !== null) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    const formRef = React.createRef();

    function App() {
      return (
        <ErrorBoundary>
          <form
            action={() => {
              throw new Error('Oh no!');
            }}
            ref={formRef}>
            <Text text="Everything is fine" />
          </form>
        </ErrorBoundary>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => root.render(<App />));
    assertLog(['Everything is fine']);
    expect(container.textContent).toBe('Everything is fine');

    await submit(formRef.current);
    assertLog(['Oh no!', 'Oh no!']);
    expect(container.textContent).toBe('Oh no!');
  });

  it('async errors in form actions can be captured by an error boundary', async () => {
    if (gate(flags => !(flags.enableFormActions && flags.enableAsyncActions))) {
      // TODO: Uncaught JSDOM errors fail the test after the scope has finished
      // so don't work with the `gate` mechanism.
      return;
    }

    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error !== null) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    const formRef = React.createRef();

    function App() {
      return (
        <ErrorBoundary>
          <form
            action={async () => {
              Scheduler.log('Async action started');
              await getText('Wait');
              throw new Error('Oh no!');
            }}
            ref={formRef}>
            <Text text="Everything is fine" />
          </form>
        </ErrorBoundary>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => root.render(<App />));
    assertLog(['Everything is fine']);
    expect(container.textContent).toBe('Everything is fine');

    await submit(formRef.current);
    assertLog(['Async action started']);
    expect(container.textContent).toBe('Everything is fine');

    await act(() => resolveText('Wait'));
    assertLog(['Oh no!', 'Oh no!']);
    expect(container.textContent).toBe('Oh no!');
  });
});
