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
  let waitForThrow;
  let useState;
  let Suspense;
  let startTransition;
  let textCache;
  let useFormStatus;
  let useActionState;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
    waitForThrow = require('internal-test-utils').waitForThrow;
    useState = React.useState;
    Suspense = React.Suspense;
    startTransition = React.startTransition;
    useFormStatus = ReactDOM.useFormStatus;
    container = document.createElement('div');
    document.body.appendChild(container);

    textCache = new Map();

    if (__VARIANT__) {
      // Remove after API is deleted.
      useActionState = ReactDOM.useFormState;
    } else {
      useActionState = React.useActionState;
    }
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
      thenable.pings.forEach(t => t(text));
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
      'Warning: In HTML, <form> cannot be a descendant of <form>.\n' +
        'This will cause a hydration error.' +
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
    const inputRef = React.createRef();
    const buttonRef = React.createRef();
    let button;
    let title;

    function action(formData) {
      button = formData.get('button');
      title = formData.get('title');
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(
        <form action={action}>
          <input type="text" name="title" defaultValue="hello" />
          <input type="submit" name="button" value="save" />
          <input type="submit" name="button" value="delete" ref={inputRef} />
          <button name="button" value="edit" ref={buttonRef}>
            Edit
          </button>
        </form>,
      );
    });

    container.addEventListener('formdata', e => {
      // Process in the formdata event somehow
      if (e.formData.get('button') === 'delete') {
        e.formData.delete('title');
      }
    });

    await submit(inputRef.current);

    expect(button).toBe('delete');
    expect(title).toBe(null);

    await submit(buttonRef.current);

    expect(button).toBe('edit');
    expect(title).toBe('hello');

    // Ensure that the type field got correctly restored
    expect(inputRef.current.getAttribute('type')).toBe('submit');
    expect(buttonRef.current.getAttribute('type')).toBe(null);
  });

  // @gate enableFormActions
  it('excludes the submitter name when the submitter is a function action', async () => {
    const inputRef = React.createRef();
    const buttonRef = React.createRef();
    let button;

    function action(formData) {
      // A function action cannot control the name since it might be controlled by the server
      // so we need to make sure it doesn't get into the FormData.
      button = formData.get('button');
    }

    const root = ReactDOMClient.createRoot(container);
    await expect(async () => {
      await act(async () => {
        root.render(
          <form>
            <input
              type="submit"
              name="button"
              value="delete"
              ref={inputRef}
              formAction={action}
            />
            <button
              name="button"
              value="edit"
              ref={buttonRef}
              formAction={action}>
              Edit
            </button>
          </form>,
        );
      });
    }).toErrorDev([
      'Cannot specify a "name" prop for a button that specifies a function as a formAction.',
    ]);

    await submit(inputRef.current);

    expect(button).toBe(null);

    await submit(buttonRef.current);

    expect(button).toBe(null);

    // Ensure that the type field got correctly restored
    expect(inputRef.current.getAttribute('type')).toBe('submit');
    expect(buttonRef.current.getAttribute('type')).toBe(null);
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

    function Status() {
      const {pending} = useFormStatus();
      return pending ? <Text text="Pending..." /> : null;
    }

    function App() {
      const [state, setState] = useState('Initial');
      return (
        <form action={() => setState('Updated')} ref={formRef}>
          <Status />
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
    assertLog(['Pending...', 'Suspend! [Updated]', 'Loading...']);
    expect(container.textContent).toBe('Pending...Initial');

    await act(() => resolveText('Updated'));
    assertLog(['Updated']);
    expect(container.textContent).toBe('Updated');
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  it('multiple form actions', async () => {
    const formRef = React.createRef();

    function Status() {
      const {pending} = useFormStatus();
      return pending ? <Text text="Pending..." /> : null;
    }

    function App() {
      const [state, setState] = useState(0);
      return (
        <form action={() => setState(n => n + 1)} ref={formRef}>
          <Status />
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
    assertLog(['Pending...', 'Suspend! [Count: 1]', 'Loading...']);
    expect(container.textContent).toBe('Pending...Count: 0');

    await act(() => resolveText('Count: 1'));
    assertLog(['Count: 1']);
    expect(container.textContent).toBe('Count: 1');

    // Update again
    await submit(formRef.current);
    assertLog(['Pending...', 'Suspend! [Count: 2]', 'Loading...']);
    expect(container.textContent).toBe('Pending...Count: 1');

    await act(() => resolveText('Count: 2'));
    assertLog(['Count: 2']);
    expect(container.textContent).toBe('Count: 2');
  });

  // @gate enableFormActions
  it('form actions can be asynchronous', async () => {
    const formRef = React.createRef();

    function Status() {
      const {pending} = useFormStatus();
      return pending ? <Text text="Pending..." /> : null;
    }

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
          <Status />
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
    assertLog(['Async action started', 'Pending...']);

    await act(() => resolveText('Wait'));
    assertLog(['Suspend! [Updated]', 'Loading...']);
    expect(container.textContent).toBe('Pending...Initial');

    await act(() => resolveText('Updated'));
    assertLog(['Updated']);
    expect(container.textContent).toBe('Updated');
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

  // @gate enableFormActions
  // @gate enableAsyncActions
  it('useFormStatus reads the status of a pending form action', async () => {
    const formRef = React.createRef();

    function Status() {
      const {pending, data, action, method} = useFormStatus();
      if (!pending) {
        return <Text text="No pending action" />;
      } else {
        const foo = data.get('foo');
        return (
          <Text
            text={`Pending action ${action.name}: foo is ${foo}, method is ${method}`}
          />
        );
      }
    }

    async function myAction() {
      Scheduler.log('Async action started');
      await getText('Wait');
      Scheduler.log('Async action finished');
    }

    function App() {
      return (
        <form action={myAction} ref={formRef}>
          <input type="text" name="foo" defaultValue="bar" />
          <Status />
        </form>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => root.render(<App />));
    assertLog(['No pending action']);
    expect(container.textContent).toBe('No pending action');

    await submit(formRef.current);
    assertLog([
      'Async action started',
      'Pending action myAction: foo is bar, method is get',
    ]);
    expect(container.textContent).toBe(
      'Pending action myAction: foo is bar, method is get',
    );

    await act(() => resolveText('Wait'));
    assertLog(['Async action finished', 'No pending action']);
  });

  // @gate enableFormActions
  it('should error if submitting a form manually', async () => {
    const ref = React.createRef();

    let error = null;
    let result = null;

    function emulateForceSubmit(submitter) {
      const form = submitter.form || submitter;
      const action =
        (submitter && submitter.getAttribute('formaction')) || form.action;
      try {
        if (!/\s*javascript:/i.test(action)) {
          throw new Error('Navigate to: ' + action);
        } else {
          // eslint-disable-next-line no-new-func
          result = Function(action.slice(11))();
        }
      } catch (x) {
        error = x;
      }
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(
        <form
          action={() => {}}
          ref={ref}
          onSubmit={e => {
            e.preventDefault();
            emulateForceSubmit(e.target);
          }}>
          <input type="text" name="foo" defaultValue="bar" />
        </form>,
      );
    });

    // This submits the form, which gets blocked and then resubmitted. It's a somewhat
    // common idiom but we don't support this pattern unless it uses requestSubmit().
    await submit(ref.current);
    expect(result).toBe(null);
    expect(error.message).toContain(
      'A React form was unexpectedly submitted. If you called form.submit()',
    );
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  test('useActionState updates state asynchronously and queues multiple actions', async () => {
    let actionCounter = 0;
    async function action(state, type) {
      actionCounter++;

      Scheduler.log(`Async action started [${actionCounter}]`);
      await getText(`Wait [${actionCounter}]`);

      switch (type) {
        case 'increment':
          return state + 1;
        case 'decrement':
          return state - 1;
        default:
          return state;
      }
    }

    let dispatch;
    function App() {
      const [state, _dispatch, isPending] = useActionState(action, 0);
      dispatch = _dispatch;
      const pending = isPending ? 'Pending ' : '';
      return <Text text={pending + state} />;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => root.render(<App />));
    assertLog(['0']);
    expect(container.textContent).toBe('0');

    await act(() => dispatch('increment'));
    assertLog(['Async action started [1]', 'Pending 0']);
    expect(container.textContent).toBe('Pending 0');

    // Dispatch a few more actions. None of these will start until the previous
    // one finishes.
    await act(() => dispatch('increment'));
    await act(() => dispatch('decrement'));
    await act(() => dispatch('increment'));
    assertLog([]);

    // Each action starts as soon as the previous one finishes.
    // NOTE: React does not render in between these actions because they all
    // update the same queue, which means they get entangled together. This is
    // intentional behavior.
    await act(() => resolveText('Wait [1]'));
    assertLog(['Async action started [2]']);
    await act(() => resolveText('Wait [2]'));
    assertLog(['Async action started [3]']);
    await act(() => resolveText('Wait [3]'));
    assertLog(['Async action started [4]']);
    await act(() => resolveText('Wait [4]'));

    // Finally the last action finishes and we can render the result.
    assertLog(['2']);
    expect(container.textContent).toBe('2');
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  test('useActionState supports inline actions', async () => {
    let increment;
    function App({stepSize}) {
      const [state, dispatch, isPending] = useActionState(async prevState => {
        return prevState + stepSize;
      }, 0);
      increment = dispatch;
      const pending = isPending ? 'Pending ' : '';
      return <Text text={pending + state} />;
    }

    // Initial render
    const root = ReactDOMClient.createRoot(container);
    await act(() => root.render(<App stepSize={1} />));
    assertLog(['0']);

    // Perform an action. This will increase the state by 1, as defined by the
    // stepSize prop.
    await act(() => increment());
    assertLog(['Pending 0', '1']);

    // Now increase the stepSize prop to 10. Subsequent steps will increase
    // by this amount.
    await act(() => root.render(<App stepSize={10} />));
    assertLog(['1']);

    // Increment again. The state should increase by 10.
    await act(() => increment());
    assertLog(['Pending 1', '11']);
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  test('useActionState: dispatch throws if called during render', async () => {
    function App() {
      const [state, dispatch, isPending] = useActionState(async () => {}, 0);
      dispatch();
      const pending = isPending ? 'Pending ' : '';
      return <Text text={pending + state} />;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(<App />);
      await waitForThrow('Cannot update form state while rendering.');
    });
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  test('queues multiple actions and runs them in order', async () => {
    let action;
    function App() {
      const [state, dispatch, isPending] = useActionState(
        async (s, a) => await getText(a),
        'A',
      );
      action = dispatch;
      const pending = isPending ? 'Pending ' : '';
      return <Text text={pending + state} />;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => root.render(<App />));
    assertLog(['A']);

    await act(() => action('B'));
    // The first dispatch will update the pending state.
    assertLog(['Pending A']);
    await act(() => action('C'));
    await act(() => action('D'));
    assertLog([]);

    await act(() => resolveText('B'));
    await act(() => resolveText('C'));
    await act(() => resolveText('D'));

    assertLog(['D']);
    expect(container.textContent).toBe('D');
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  test('useActionState: works if action is sync', async () => {
    let increment;
    function App({stepSize}) {
      const [state, dispatch, isPending] = useActionState(prevState => {
        return prevState + stepSize;
      }, 0);
      increment = dispatch;
      const pending = isPending ? 'Pending ' : '';
      return <Text text={pending + state} />;
    }

    // Initial render
    const root = ReactDOMClient.createRoot(container);
    await act(() => root.render(<App stepSize={1} />));
    assertLog(['0']);

    // Perform an action. This will increase the state by 1, as defined by the
    // stepSize prop.
    await act(() => increment());
    assertLog(['Pending 0', '1']);

    // Now increase the stepSize prop to 10. Subsequent steps will increase
    // by this amount.
    await act(() => root.render(<App stepSize={10} />));
    assertLog(['1']);

    // Increment again. The state should increase by 10.
    await act(() => increment());
    assertLog(['Pending 1', '11']);
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  test('useActionState: can mix sync and async actions', async () => {
    let action;
    function App() {
      const [state, dispatch, isPending] = useActionState((s, a) => a, 'A');
      action = dispatch;
      const pending = isPending ? 'Pending ' : '';
      return <Text text={pending + state} />;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => root.render(<App />));
    assertLog(['A']);

    await act(() => action(getText('B')));
    // The first dispatch will update the pending state.
    assertLog(['Pending A']);
    await act(() => action('C'));
    await act(() => action(getText('D')));
    await act(() => action('E'));
    assertLog([]);

    await act(() => resolveText('B'));
    await act(() => resolveText('D'));
    assertLog(['E']);
    expect(container.textContent).toBe('E');
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  test('useActionState: error handling (sync action)', async () => {
    let resetErrorBoundary;
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        resetErrorBoundary = () => this.setState({error: null});
        if (this.state.error !== null) {
          return <Text text={'Caught an error: ' + this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    let action;
    function App() {
      const [state, dispatch, isPending] = useActionState((s, a) => {
        if (a.endsWith('!')) {
          throw new Error(a);
        }
        return a;
      }, 'A');
      action = dispatch;
      const pending = isPending ? 'Pending ' : '';
      return <Text text={pending + state} />;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() =>
      root.render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>,
      ),
    );
    assertLog(['A']);

    await act(() => action('Oops!'));
    assertLog([
      // Action begins, error has not thrown yet.
      'Pending A',
      // Now the action runs and throws.
      'Caught an error: Oops!',
      'Caught an error: Oops!',
    ]);
    expect(container.textContent).toBe('Caught an error: Oops!');

    // Reset the error boundary
    await act(() => resetErrorBoundary());
    assertLog(['A']);

    // Trigger an error again, but this time, perform another action that
    // overrides the first one and fixes the error
    await act(() => {
      action('Oops!');
      action('B');
    });
    assertLog(['Pending A', 'B']);
    expect(container.textContent).toBe('B');
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  test('useActionState: error handling (async action)', async () => {
    let resetErrorBoundary;
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        resetErrorBoundary = () => this.setState({error: null});
        if (this.state.error !== null) {
          return <Text text={'Caught an error: ' + this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    let action;
    function App() {
      const [state, dispatch, isPending] = useActionState(async (s, a) => {
        const text = await getText(a);
        if (text.endsWith('!')) {
          throw new Error(text);
        }
        return text;
      }, 'A');
      action = dispatch;
      const pending = isPending ? 'Pending ' : '';
      return <Text text={pending + state} />;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() =>
      root.render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>,
      ),
    );
    assertLog(['A']);

    await act(() => action('Oops!'));
    // The first dispatch will update the pending state.
    assertLog(['Pending A']);
    await act(() => resolveText('Oops!'));
    assertLog(['Caught an error: Oops!', 'Caught an error: Oops!']);
    expect(container.textContent).toBe('Caught an error: Oops!');

    // Reset the error boundary
    await act(() => resetErrorBoundary());
    assertLog(['A']);

    // Trigger an error again, but this time, perform another action that
    // overrides the first one and fixes the error
    await act(() => {
      action('Oops!');
      action('B');
    });
    assertLog(['Pending A']);
    await act(() => resolveText('B'));
    assertLog(['B']);
    expect(container.textContent).toBe('B');
  });

  // @gate enableFormActions
  // @gate enableAsyncActions
  test('useFormState works in StrictMode', async () => {
    let actionCounter = 0;
    async function action(state, type) {
      actionCounter++;

      Scheduler.log(`Async action started [${actionCounter}]`);
      await getText(`Wait [${actionCounter}]`);

      switch (type) {
        case 'increment':
          return state + 1;
        case 'decrement':
          return state - 1;
        default:
          return state;
      }
    }

    let dispatch;
    function App() {
      const [state, _dispatch, isPending] = useActionState(action, 0);
      dispatch = _dispatch;
      const pending = isPending ? 'Pending ' : '';
      return <Text text={pending + state} />;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() =>
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      ),
    );
    assertLog(['0']);
    expect(container.textContent).toBe('0');

    await act(() => dispatch('increment'));
    assertLog(['Async action started [1]', 'Pending 0']);
    expect(container.textContent).toBe('Pending 0');

    await act(() => resolveText('Wait [1]'));
    assertLog(['1']);
    expect(container.textContent).toBe('1');
  });
});
