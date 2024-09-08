let React;
let ReactNoop;
let Scheduler;
let act;
let assertLog;
let waitForPaint;
let textCache;
let startTransition;
let Suspense;
let Activity;

describe('ReactSiblingPrerendering', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('internal-test-utils').act;
    assertLog = require('internal-test-utils').assertLog;
    waitForPaint = require('internal-test-utils').waitForPaint;
    startTransition = React.startTransition;
    Suspense = React.Suspense;
    Activity = React.unstable_Activity;

    textCache = new Map();
  });

  // function resolveText(text) {
  //   const record = textCache.get(text);
  //   if (record === undefined) {
  //     const newRecord = {
  //       status: 'resolved',
  //       value: text,
  //     };
  //     textCache.set(text, newRecord);
  //   } else if (record.status === 'pending') {
  //     const thenable = record.value;
  //     record.status = 'resolved';
  //     record.value = text;
  //     thenable.pings.forEach(t => t());
  //   }
  // }

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

  // function getText(text) {
  //   const record = textCache.get(text);
  //   if (record === undefined) {
  //     const thenable = {
  //       pings: [],
  //       then(resolve) {
  //         if (newRecord.status === 'pending') {
  //           thenable.pings.push(resolve);
  //         } else {
  //           Promise.resolve().then(() => resolve(newRecord.value));
  //         }
  //       },
  //     };
  //     const newRecord = {
  //       status: 'pending',
  //       value: thenable,
  //     };
  //     textCache.set(text, newRecord);
  //     return thenable;
  //   } else {
  //     switch (record.status) {
  //       case 'pending':
  //         return record.value;
  //       case 'rejected':
  //         return Promise.reject(record.value);
  //       case 'resolved':
  //         return Promise.resolve(record.value);
  //     }
  //   }
  // }

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  function AsyncText({text}) {
    readText(text);
    Scheduler.log(text);
    return text;
  }

  it("don't prerender siblings when something errors", async () => {
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

    function Oops() {
      throw new Error('Oops!');
    }

    function App() {
      return (
        <>
          <div>
            <ErrorBoundary>
              <Oops />
              <AsyncText text="A" />
            </ErrorBoundary>
          </div>
          <div>
            <AsyncText text="B" />
            <AsyncText text="C" />
          </div>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => startTransition(() => root.render(<App />)));
    assertLog([
      'Oops!',

      // A is skipped because we don't prerender siblings when
      // something errors.

      'Suspend! [B]',

      // After B suspends, we're still able to prerender C without starting
      // over because there's no fallback, so the root is blocked from
      // committing anyway.
      ...(gate('enableSiblingPrerendering') ? ['Suspend! [C]'] : []),
    ]);
  });

  // @gate enableActivity
  it("don't skip siblings when rendering inside a hidden tree", async () => {
    function App() {
      return (
        <>
          <Text text="A" />
          <Activity mode="hidden">
            <Suspense fallback={<Text text="Loading..." />}>
              <AsyncText text="B" />
              <AsyncText text="C" />
            </Suspense>
          </Activity>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(async () => root.render(<App />));

      // The first render includes only the visible part of the tree. The
      // hidden content is deferred until later.
      await waitForPaint(['A']);
      expect(root).toMatchRenderedOutput('A');

      // The second render is a prerender of the hidden content.
      await waitForPaint([
        'Suspend! [B]',

        // If B and C were visible, C would not have been attempted
        // during this pass, because it would prevented the fallback
        // from showing.
        ...(gate('enableSiblingPrerendering') ? ['Suspend! [C]'] : []),

        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput('A');
    });
  });

  it('start prerendering retries right after the fallback commits', async () => {
    function App() {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text="A" />
          <AsyncText text="B" />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => root.render(<App />));

      // On the first attempt, A suspends. Unwind and show a fallback, without
      // attempting B.
      await waitForPaint(['Suspend! [A]', 'Loading...']);
      expect(root).toMatchRenderedOutput('Loading...');

      // Immediately after the fallback commits, retry the boundary again. This
      // time we include B, since we're not blocking the fallback from showing.
      if (gate('enableSiblingPrerendering')) {
        await waitForPaint(['Suspend! [A]', 'Suspend! [B]']);
      }
    });
    expect(root).toMatchRenderedOutput('Loading...');
  });
});
