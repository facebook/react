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
let ReactDOMClient;
let ReactDOMServer;
let Scheduler;
let Suspense;
let assertLog;
let waitForAll;
let waitFor;
let act;

function dispatchClickEvent(target) {
  const mouseOutEvent = document.createEvent('MouseEvents');
  mouseOutEvent.initMouseEvent(
    'click',
    true,
    true,
    window,
    0,
    50,
    50,
    50,
    50,
    false,
    false,
    false,
    false,
    0,
    target,
  );
  return target.dispatchEvent(mouseOutEvent);
}

describe('ReactDOMServerScheduleHydration', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;

    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;
    waitForAll = InternalTestUtils.waitForAll;
    waitFor = InternalTestUtils.waitFor;
    act = InternalTestUtils.act;
  });

  describe('with no boundary', () => {
    it('resolves immediately for already hydrated content with no boundary', async () => {
      function Child({text, onClick}) {
        Scheduler.log(text);
        return (
          <span
            onClick={() => {
              Scheduler.log('Clicked ' + text);
              onClick(text);
            }}>
            {text}
          </span>
        );
      }

      function App() {
        const [, setText] = React.useState('UNSET');
        Scheduler.log('App');
        return (
          <div>
            <Child text="A" onClick={setText} />
          </div>
        );
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);
      assertLog(['App', 'A']);

      const container = document.createElement('div');
      container.innerHTML = finalHTML;
      const spanA = container.getElementsByTagName('span')[0];

      const root = ReactDOMClient.hydrateRoot(container, <App />);

      // Nothing has been hydrated so far.
      assertLog([]);

      // Hydrate everything
      await waitForAll(['App', 'A']);

      await root.unstable_scheduleHydration(spanA);

      await act(() => {
        const result = dispatchClickEvent(spanA);
        expect(result).toBe(true);

        assertLog(['Clicked A']);
      });

      assertLog(['App', 'A']);
    });

    it('resolves after content is hydrated with no boundary', async () => {
      function Child({text, onClick}) {
        Scheduler.log(text);
        return (
          <span
            onClick={() => {
              Scheduler.log('Clicked ' + text);
              onClick(text);
            }}>
            {text}
          </span>
        );
      }

      function App() {
        const [, setText] = React.useState('UNSET');
        Scheduler.log('App');
        return (
          <div>
            <Child text="A" onClick={setText} />
          </div>
        );
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);
      assertLog(['App', 'A']);

      const container = document.createElement('div');
      container.innerHTML = finalHTML;
      const spanA = container.getElementsByTagName('span')[0];

      const root = ReactDOMClient.hydrateRoot(container, <App />);

      let hydrated = false;
      const scheduleHydrationOnA = root
        .unstable_scheduleHydration(spanA)
        .then(() => (hydrated = true));

      // Nothing has been hydrated so far.
      assertLog([]);
      expect(hydrated).toBe(false);

      // Hydrate everything
      await waitForAll(['App', 'A']);
      await scheduleHydrationOnA;

      expect(hydrated).toBe(true);

      await act(() => {
        const result = dispatchClickEvent(spanA);
        expect(result).toBe(true);

        assertLog(['Clicked A']);
      });

      assertLog(['App', 'A']);
    });
  });

  describe('with a boundary', () => {
    it('resolves immediately for already hydrated content', async () => {
      function Child({text, onClick}) {
        Scheduler.log(text);
        return (
          <span
            onClick={() => {
              Scheduler.log('Clicked ' + text);
              onClick(text);
            }}>
            {text}
          </span>
        );
      }

      function App() {
        const [, setText] = React.useState('UNSET');
        Scheduler.log('App');
        return (
          <div>
            <Suspense fallback="Loading...">
              <Child text="A" onClick={setText} />
            </Suspense>
          </div>
        );
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);
      assertLog(['App', 'A']);

      const container = document.createElement('div');
      container.innerHTML = finalHTML;
      const spanA = container.getElementsByTagName('span')[0];

      const root = ReactDOMClient.hydrateRoot(container, <App />);

      // Nothing has been hydrated so far.
      assertLog([]);

      // Hydrate everything
      await waitForAll(['App', 'A']);
      await root.unstable_scheduleHydration(spanA);

      await act(() => {
        const result = dispatchClickEvent(spanA);
        expect(result).toBe(true);

        assertLog(['Clicked A']);
      });

      assertLog(['App', 'A']);
    });

    it('resolves after content is hydrated', async () => {
      function Child({text, onClick}) {
        Scheduler.log(text);
        return (
          <span
            onClick={() => {
              Scheduler.log('Clicked ' + text);
              onClick(text);
            }}>
            {text}
          </span>
        );
      }

      function App() {
        const [setText] = React.useState('UNSET');
        Scheduler.log('App');
        return (
          <div>
            <Suspense fallback="Loading...">
              <Child text="A" onClick={setText} />
            </Suspense>
          </div>
        );
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);
      assertLog(['App', 'A']);

      const container = document.createElement('div');
      container.innerHTML = finalHTML;
      const spanA = container.getElementsByTagName('span')[0];

      const root = ReactDOMClient.hydrateRoot(container, <App />);

      let hydrated = false;
      const scheduleHydrationA = root
        .unstable_scheduleHydration(spanA)
        .then(() => (hydrated = true));

      // Nothing has been hydrated so far.
      assertLog([]);
      expect(hydrated).toBe(false);

      // Hydrate everything
      await waitForAll(['App', 'A']);
      await scheduleHydrationA;

      expect(hydrated).toBe(true);

      const result = dispatchClickEvent(spanA);
      expect(result).toBe(true);

      assertLog(['Clicked A']);

      waitForAll(['App', 'A']);
    });
  });

  describe('with multiple boundaries', () => {
    it('resolve immediately for already hydrated content', async () => {
      function Child({text, onClick}) {
        Scheduler.log(text);
        return (
          <span
            onClick={e => {
              e.preventDefault();
              Scheduler.log('Clicked ' + text);
              onClick(text);
            }}>
            {text}
          </span>
        );
      }

      function App() {
        const [, setText] = React.useState('UNSET');
        Scheduler.log('App');
        return (
          <div>
            <Child text="A" onClick={setText} />
            <Suspense fallback="Loading...">
              <Child text="B" onClick={setText} />
            </Suspense>
            <Suspense fallback="Loading...">
              <Child text="C" onClick={setText} />
            </Suspense>
          </div>
        );
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);
      assertLog(['App', 'A', 'B', 'C']);

      const container = document.createElement('div');
      container.innerHTML = finalHTML;
      const spanA = container.getElementsByTagName('span')[0];
      const spanB = container.getElementsByTagName('span')[1];
      const spanC = container.getElementsByTagName('span')[2];

      const root = ReactDOMClient.hydrateRoot(container, <App />);

      // Nothing has been hydrated so far.
      assertLog([]);

      // Hydrate just A
      await waitFor(['App', 'A']);

      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        // For sync by default, hydration is immediately observable.
        await root.unstable_scheduleHydration(spanA);

        const resultA = dispatchClickEvent(spanA);
        expect(resultA).toBe(true);

        assertLog(['Clicked A']);

        // Hydrate everything else
        await waitForAll([
          'App',
          'A',
          'B',
          'App',
          'A',
          'B',
          'C',
          'App',
          'A',
          'B',
          'C',
        ]);
      } else {
        // For concurrent by default, we need to finish flushing everything.
        await waitForAll(['B', 'C']);

        await root.unstable_scheduleHydration(spanA);
      }

      await root.unstable_scheduleHydration(spanB);
      await waitForAll([]);
      dispatchClickEvent(spanB);
      assertLog(['Clicked B']);
      await waitForAll(['App', 'A', 'B', 'C']);

      await root.unstable_scheduleHydration(spanC);
      dispatchClickEvent(spanC);
      assertLog(['Clicked C']);
      await waitForAll(['App', 'A', 'B', 'C']);
    });

    it('resolve after content is hydrated', async () => {
      function Child({text, onClick}) {
        Scheduler.log(text);
        return (
          <span
            onClick={() => {
              Scheduler.log('Clicked ' + text);
              onClick(text);
            }}>
            {text}
          </span>
        );
      }

      function App() {
        const [, setText] = React.useState('UNSET');
        Scheduler.log('App');
        return (
          <div>
            <Child text="A" onClick={setText} />
            <Suspense fallback="Loading...">
              <Child text="B" onClick={setText} />
            </Suspense>
            <Suspense fallback="Loading...">
              <Child text="C" onClick={setText} />
            </Suspense>
          </div>
        );
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);
      assertLog(['App', 'A', 'B', 'C']);

      const container = document.createElement('div');
      container.innerHTML = finalHTML;
      const spanA = container.getElementsByTagName('span')[0];
      const spanB = container.getElementsByTagName('span')[1];
      const spanC = container.getElementsByTagName('span')[2];

      const root = ReactDOMClient.hydrateRoot(container, <App />);
      let hydratedA = false;
      const scheduleHydrationA = root
        .unstable_scheduleHydration(spanA)
        .then(() => (hydratedA = true));

      let hydratedB = false;
      const scheduleHydrationB = root
        .unstable_scheduleHydration(spanB)
        .then(() => (hydratedB = true));

      let hydratedC = false;
      const scheduleHydrationC = root
        .unstable_scheduleHydration(spanC)
        .then(() => (hydratedC = true));

      // Nothing has been hydrated so far.
      assertLog([]);
      expect(hydratedA).toBe(false);
      expect(hydratedB).toBe(false);
      expect(hydratedC).toBe(false);

      // Hydrate everything
      await waitForAll(['App', 'A', 'C', 'B']);

      await scheduleHydrationA;
      await scheduleHydrationB;
      await scheduleHydrationC;

      // Increase priority of B and then C.
      expect(hydratedA).toBe(true);
      expect(hydratedB).toBe(true);
      expect(hydratedC).toBe(true);

      const resultA = dispatchClickEvent(spanA);
      expect(resultA).toBe(true);
      assertLog(['Clicked A']);
      await waitForAll(['App', 'A', 'B', 'C']);

      const resultB = dispatchClickEvent(spanB);
      expect(resultB).toBe(true);
      assertLog(['Clicked B']);
      await waitForAll(['App', 'A', 'B', 'C']);

      const resultC = dispatchClickEvent(spanC);
      expect(resultC).toBe(true);
      assertLog(['Clicked C']);
      await waitForAll(['App', 'A', 'B', 'C']);
    });

    it('resolve out of order content', async () => {
      function Child({text, onClick}) {
        Scheduler.log(text);
        return (
          <span
            onClick={() => {
              Scheduler.log('Clicked ' + text);
              onClick(text);
            }}>
            {text}
          </span>
        );
      }

      function App() {
        const [, setText] = React.useState('UNSET');
        Scheduler.log('App');
        return (
          <div>
            <Child text="A" onClick={setText} />
            <Suspense fallback="Loading...">
              <Child text="B" onClick={setText} />
            </Suspense>
            <Suspense fallback="Loading...">
              <Child text="C" onClick={setText} />
            </Suspense>
          </div>
        );
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);

      assertLog(['App', 'A', 'B', 'C']);

      const container = document.createElement('div');
      container.innerHTML = finalHTML;

      const spanC = container.getElementsByTagName('span')[2];

      const root = ReactDOMClient.hydrateRoot(container, <App />);

      let hydratedC = false;
      const scheduleHydrationC = root
        .unstable_scheduleHydration(spanC)
        .then(() => (hydratedC = true));

      // Nothing has been hydrated so far.
      assertLog([]);

      expect(hydratedC).toBe(false);

      await waitForAll(['App', 'A', 'C', 'B']);
      await scheduleHydrationC;
      const resultC = dispatchClickEvent(spanC);
      expect(resultC).toBe(true);
      assertLog(['Clicked C']);

      await waitForAll(['App', 'A', 'B', 'C']);
    });
  });

  describe('edge cases', () => {
    it('rejects if target node is undefined', async () => {
      function Child({text}) {
        Scheduler.log(text);
        return <span>{text}</span>;
      }

      function App() {
        Scheduler.log('App');
        return (
          <div>
            <Child text="A" />
          </div>
        );
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);
      assertLog(['App', 'A']);

      const container = document.createElement('div');
      container.innerHTML = finalHTML;

      const root = ReactDOMClient.hydrateRoot(container, <App />);

      // Nothing has been hydrated so far.
      assertLog([]);

      let hydrationError = null;
      await root
        .unstable_scheduleHydration(undefined)
        .catch(error => (hydrationError = error));

      expect(hydrationError.message).toMatch(
        'Cannot schedule hydration, target is undefined.',
      );
    });

    it('rejects if target node is not in this root', async () => {
      function Child({text}) {
        Scheduler.log(text);
        return <span>{text}</span>;
      }

      function App() {
        Scheduler.log('App');
        return (
          <div>
            <Child text="A" />
          </div>
        );
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);
      assertLog(['App', 'A']);

      const nodeOutsideContainer = document.createElement('span');
      const container = document.createElement('div');
      container.innerHTML = finalHTML;

      const root = ReactDOMClient.hydrateRoot(container, <App />);

      // Nothing has been hydrated so far.
      assertLog([]);

      let hydrationError = null;
      await root
        .unstable_scheduleHydration(nodeOutsideContainer)
        .catch(error => (hydrationError = error));

      expect(hydrationError.message).toMatch(
        'Cannot schedule hydration, target is not a React component.',
      );
    });

    it('rejects if target node is deleted before successfully hydrated', async () => {
      // Ignore hydration errors.
      spyOnDev(console, 'error').mockImplementation(() => {});
      spyOnDev(console, 'warn').mockImplementation(() => {});

      function Child({text}) {
        Scheduler.log(text);
        return <span>{text}</span>;
      }

      function App() {
        Scheduler.log('App');
        return (
          <div>
            <Suspense fallback="Loading...">
              <Child text="A" />
            </Suspense>
            <Suspense fallback="Loading...">
              <Child text="B" />
            </Suspense>
          </div>
        );
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);

      assertLog(['App', 'A', 'B']);

      const container = document.createElement('div');
      container.innerHTML = finalHTML;

      const spanB = container.getElementsByTagName('span')[1];

      const root = ReactDOMClient.hydrateRoot(container, <App />);

      // Nothing has been hydrated so far.
      assertLog([]);

      await waitFor(['App', 'A']);

      let hydrationError = null;
      const hydrationPromise = root
        .unstable_scheduleHydration(spanB)
        .catch(e => (hydrationError = e));

      spanB.remove();

      if (__DEV__) {
        await waitForAll(['B', 'B', 'A']);
      } else {
        // TODO: Why the extra 'App'?
        await waitForAll(['B', 'App', 'B', 'A']);
      }

      await hydrationPromise;

      expect(hydrationError.message).toMatch(
        'Target was removed before hydration.',
      );
    });

    it('resolves if target node is inside dangerouslySetInnerHTML', async () => {
      function App() {
        Scheduler.log('App');
        return <div dangerouslySetInnerHTML={{__html: '<span>A</span>'}} />;
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);

      assertLog(['App']);

      const container = document.createElement('div');
      container.innerHTML = finalHTML;

      const spanA = container.getElementsByTagName('span')[0];

      const root = ReactDOMClient.hydrateRoot(container, <App />);

      // Nothing has been hydrated so far.
      assertLog([]);

      await waitFor(['App']);

      let hydrated;
      const scheduleHydration = root
        .unstable_scheduleHydration(spanA)
        .then(() => (hydrated = true));

      try {
        await waitForAll(['B', 'B']);
      } catch (e) {
        // ignore hydration mismatch
      }

      await scheduleHydration;

      expect(hydrated).toBe(true);
    });
  });
});
