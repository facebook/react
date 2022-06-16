let React;
let ReactNoop;
let Scheduler;
let act;
let Suspense;
let useState;
let textCache;

let readText;
let resolveText;
// let rejectText;

describe('ReactSuspenseWithNoopRenderer', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    Suspense = React.Suspense;
    useState = React.useState;

    textCache = new Map();

    readText = text => {
      const record = textCache.get(text);
      if (record !== undefined) {
        switch (record.status) {
          case 'pending':
            throw record.promise;
          case 'rejected':
            throw Error('Failed to load: ' + text);
          case 'resolved':
            return text;
        }
      } else {
        let ping;
        const promise = new Promise(resolve => (ping = resolve));
        const newRecord = {
          status: 'pending',
          ping: ping,
          promise,
        };
        textCache.set(text, newRecord);
        throw promise;
      }
    };

    resolveText = text => {
      const record = textCache.get(text);
      if (record !== undefined) {
        if (record.status === 'pending') {
          record.ping();
          record.ping = null;
          record.status = 'resolved';
          record.promise = null;
        }
      } else {
        const newRecord = {
          ping: null,
          status: 'resolved',
          promise: null,
        };
        textCache.set(text, newRecord);
      }
    };

    // rejectText = text => {
    //   const record = textCache.get(text);
    //   if (record !== undefined) {
    //     if (record.status === 'pending') {
    //       Scheduler.unstable_yieldValue(`Promise rejected [${text}]`);
    //       record.ping();
    //       record.status = 'rejected';
    //       clearTimeout(record.promise._timer);
    //       record.promise = null;
    //     }
    //   } else {
    //     const newRecord = {
    //       ping: null,
    //       status: 'rejected',
    //       promise: null,
    //     };
    //     textCache.set(text, newRecord);
    //   }
    // };
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return props.text;
  }

  function AsyncText(props) {
    const text = props.text;
    try {
      readText(text);
      Scheduler.unstable_yieldValue(text);
      return text;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        Scheduler.unstable_yieldValue(`Suspend! [${text}]`);
      } else {
        Scheduler.unstable_yieldValue(`Error! [${text}]`);
      }
      throw promise;
    }
  }

  // @gate enableCPUSuspense
  it('skips CPU-bound trees on initial mount', async () => {
    function App() {
      return (
        <>
          <Text text="Outer" />
          <div>
            <Suspense
              unstable_expectedLoadTime={2000}
              fallback={<Text text="Loading..." />}>
              <Text text="Inner" />
            </Suspense>
          </div>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
      expect(Scheduler).toFlushUntilNextPaint(['Outer', 'Loading...']);
      expect(root).toMatchRenderedOutput(
        <>
          Outer
          <div>Loading...</div>
        </>,
      );
    });
    // Inner contents finish in separate commit from outer
    expect(Scheduler).toHaveYielded(['Inner']);
    expect(root).toMatchRenderedOutput(
      <>
        Outer
        <div>Inner</div>
      </>,
    );
  });

  // @gate enableCPUSuspense
  it('does not skip CPU-bound trees during updates', async () => {
    let setCount;

    function App() {
      const [count, _setCount] = useState(0);
      setCount = _setCount;
      return (
        <>
          <Text text="Outer" />
          <div>
            <Suspense
              unstable_expectedLoadTime={2000}
              fallback={<Text text="Loading..." />}>
              <Text text={`Inner [${count}]`} />
            </Suspense>
          </div>
        </>
      );
    }

    // Initial mount
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    // Inner contents finish in separate commit from outer
    expect(Scheduler).toHaveYielded(['Outer', 'Loading...', 'Inner [0]']);
    expect(root).toMatchRenderedOutput(
      <>
        Outer
        <div>Inner [0]</div>
      </>,
    );

    // Update
    await act(async () => {
      setCount(1);
    });
    // Entire update finishes in a single commit
    expect(Scheduler).toHaveYielded(['Outer', 'Inner [1]']);
    expect(root).toMatchRenderedOutput(
      <>
        Outer
        <div>Inner [1]</div>
      </>,
    );
  });

  // @gate enableCPUSuspense
  it('suspend inside CPU-bound tree', async () => {
    function App() {
      return (
        <>
          <Text text="Outer" />
          <div>
            <Suspense
              unstable_expectedLoadTime={2000}
              fallback={<Text text="Loading..." />}>
              <AsyncText text="Inner" />
            </Suspense>
          </div>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
      expect(Scheduler).toFlushUntilNextPaint(['Outer', 'Loading...']);
      expect(root).toMatchRenderedOutput(
        <>
          Outer
          <div>Loading...</div>
        </>,
      );
    });
    // Inner contents suspended, so we continue showing a fallback.
    expect(Scheduler).toHaveYielded(['Suspend! [Inner]']);
    expect(root).toMatchRenderedOutput(
      <>
        Outer
        <div>Loading...</div>
      </>,
    );

    // Resolve the data and finish rendering
    await act(async () => {
      await resolveText('Inner');
    });
    expect(Scheduler).toHaveYielded(['Inner']);
    expect(root).toMatchRenderedOutput(
      <>
        Outer
        <div>Inner</div>
      </>,
    );
  });

  // @gate enableCPUSuspense
  it('nested CPU-bound trees', async () => {
    function App() {
      return (
        <>
          <Text text="A" />
          <div>
            <Suspense
              unstable_expectedLoadTime={2000}
              fallback={<Text text="Loading B..." />}>
              <Text text="B" />
              <div>
                <Suspense
                  unstable_expectedLoadTime={2000}
                  fallback={<Text text="Loading C..." />}>
                  <Text text="C" />
                </Suspense>
              </div>
            </Suspense>
          </div>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    // Each level commits separately
    expect(Scheduler).toHaveYielded([
      'A',
      'Loading B...',
      'B',
      'Loading C...',
      'C',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        A
        <div>
          B<div>C</div>
        </div>
      </>,
    );
  });
});
