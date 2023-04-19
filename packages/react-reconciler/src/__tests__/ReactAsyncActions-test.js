let React;
let ReactNoop;
let Scheduler;
let act;
let assertLog;
let useTransition;
let useState;
let textCache;

describe('ReactAsyncActions', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
    useTransition = React.useTransition;
    useState = React.useState;

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

  // @gate enableAsyncActions
  test('isPending remains true until async action finishes', async () => {
    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return <Text text={'Pending: ' + isPending} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App />);
    });
    assertLog(['Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');

    // At the start of an async action, isPending is set to true.
    await act(() => {
      startTransition(async () => {
        Scheduler.log('Async action started');
        await getText('Wait');
        Scheduler.log('Async action ended');
      });
    });
    assertLog(['Async action started', 'Pending: true']);
    expect(root).toMatchRenderedOutput('Pending: true');

    // Once the action finishes, isPending is set back to false.
    await act(() => resolveText('Wait'));
    assertLog(['Async action ended', 'Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');
  });

  // @gate enableAsyncActions
  test('multiple updates in an async action scope are entangled together', async () => {
    let startTransition;
    function App({text}) {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return (
        <>
          <span>
            <Text text={'Pending: ' + isPending} />
          </span>
          <span>
            <Text text={text} />
          </span>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App text="A" />);
    });
    assertLog(['Pending: false', 'A']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>A</span>
      </>,
    );

    await act(() => {
      startTransition(async () => {
        Scheduler.log('Async action started');
        await getText('Yield before updating');
        Scheduler.log('Async action ended');
        startTransition(() => root.render(<App text="B" />));
      });
    });
    assertLog(['Async action started', 'Pending: true', 'A']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A</span>
      </>,
    );

    await act(() => resolveText('Yield before updating'));
    assertLog(['Async action ended', 'Pending: false', 'B']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>B</span>
      </>,
    );
  });

  // @gate enableAsyncActions
  test('multiple async action updates in the same scope are entangled together', async () => {
    let setStepA;
    function A() {
      const [step, setStep] = useState(0);
      setStepA = setStep;
      return <AsyncText text={'A' + step} />;
    }

    let setStepB;
    function B() {
      const [step, setStep] = useState(0);
      setStepB = setStep;
      return <AsyncText text={'B' + step} />;
    }

    let setStepC;
    function C() {
      const [step, setStep] = useState(0);
      setStepC = setStep;
      return <AsyncText text={'C' + step} />;
    }

    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return (
        <>
          <span>
            <Text text={'Pending: ' + isPending} />
          </span>
          <span>
            <A />, <B />, <C />
          </span>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    resolveText('A0');
    resolveText('B0');
    resolveText('C0');
    await act(() => {
      root.render(<App text="A" />);
    });
    assertLog(['Pending: false', 'A0', 'B0', 'C0']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>A0, B0, C0</span>
      </>,
    );

    await act(() => {
      startTransition(async () => {
        Scheduler.log('Async action started');
        setStepA(1);
        await getText('Wait before updating B');
        startTransition(() => setStepB(1));
        await getText('Wait before updating C');
        startTransition(() => setStepC(1));
        Scheduler.log('Async action ended');
      });
    });
    assertLog(['Async action started', 'Pending: true', 'A0', 'B0', 'C0']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0, C0</span>
      </>,
    );

    // This will schedule an update on B, but nothing will render yet because
    // the async action scope hasn't finished.
    await act(() => resolveText('Wait before updating B'));
    assertLog([]);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0, C0</span>
      </>,
    );

    // This will schedule an update on C, and also the async action scope
    // will end. This will allow React to attempt to render the updates.
    await act(() => resolveText('Wait before updating C'));
    assertLog(['Async action ended', 'Pending: false', 'Suspend! [A1]']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0, C0</span>
      </>,
    );

    // Progressively load the all the data. Because they are all entangled
    // together, only when the all of A, B, and C updates are unblocked is the
    // render allowed to proceed.
    await act(() => resolveText('A1'));
    assertLog(['Pending: false', 'A1', 'Suspend! [B1]']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0, C0</span>
      </>,
    );
    await act(() => resolveText('B1'));
    assertLog(['Pending: false', 'A1', 'B1', 'Suspend! [C1]']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0, C0</span>
      </>,
    );

    // Finally, all the data has loaded and the transition is complete.
    await act(() => resolveText('C1'));
    assertLog(['Pending: false', 'A1', 'B1', 'C1']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>A1, B1, C1</span>
      </>,
    );
  });

  // @gate enableAsyncActions
  test('urgent updates are not blocked during an async action', async () => {
    let setStepA;
    function A() {
      const [step, setStep] = useState(0);
      setStepA = setStep;
      return <Text text={'A' + step} />;
    }

    let setStepB;
    function B() {
      const [step, setStep] = useState(0);
      setStepB = setStep;
      return <Text text={'B' + step} />;
    }

    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return (
        <>
          <span>
            <Text text={'Pending: ' + isPending} />
          </span>
          <span>
            <A />, <B />
          </span>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App text="A" />);
    });
    assertLog(['Pending: false', 'A0', 'B0']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>A0, B0</span>
      </>,
    );

    await act(() => {
      startTransition(async () => {
        Scheduler.log('Async action started');
        startTransition(() => setStepA(1));
        await getText('Wait');
        Scheduler.log('Async action ended');
      });
    });
    assertLog(['Async action started', 'Pending: true', 'A0', 'B0']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B0</span>
      </>,
    );

    // Update B at urgent priority. This should be allowed to finish.
    await act(() => setStepB(1));
    assertLog(['B1']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: true</span>
        <span>A0, B1</span>
      </>,
    );

    // Finish the async action.
    await act(() => resolveText('Wait'));
    assertLog(['Async action ended', 'Pending: false', 'A1', 'B1']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Pending: false</span>
        <span>A1, B1</span>
      </>,
    );
  });

  // @gate enableAsyncActions
  test("if a sync action throws, it's rethrown from the `useTransition`", async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return <Text text={'Pending: ' + isPending} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>,
      );
    });
    assertLog(['Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');

    await act(() => {
      startTransition(() => {
        throw new Error('Oops!');
      });
    });
    assertLog(['Pending: true', 'Oops!', 'Oops!']);
    expect(root).toMatchRenderedOutput('Oops!');
  });

  // @gate enableAsyncActions
  test("if an async action throws, it's rethrown from the `useTransition`", async () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return <Text text={this.state.error.message} />;
        }
        return this.props.children;
      }
    }

    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return <Text text={'Pending: ' + isPending} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(
        <ErrorBoundary>
          <App />
        </ErrorBoundary>,
      );
    });
    assertLog(['Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');

    await act(() => {
      startTransition(async () => {
        Scheduler.log('Async action started');
        await getText('Wait');
        throw new Error('Oops!');
      });
    });
    assertLog(['Async action started', 'Pending: true']);
    expect(root).toMatchRenderedOutput('Pending: true');

    await act(() => resolveText('Wait'));
    assertLog(['Oops!', 'Oops!']);
    expect(root).toMatchRenderedOutput('Oops!');
  });

  // @gate !enableAsyncActions
  test('when enableAsyncActions is disabled, and a sync action throws, `isPending` is turned off', async () => {
    let startTransition;
    function App() {
      const [isPending, _start] = useTransition();
      startTransition = _start;
      return <Text text={'Pending: ' + isPending} />;
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      root.render(<App />);
    });
    assertLog(['Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');

    await act(() => {
      expect(() => {
        startTransition(() => {
          throw new Error('Oops!');
        });
      }).toThrow('Oops!');
    });
    assertLog(['Pending: true', 'Pending: false']);
    expect(root).toMatchRenderedOutput('Pending: false');
  });
});
