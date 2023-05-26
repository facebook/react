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
        return <span onClick={onClick}>{text}</span>;
      }

      function App() {
        const [text, setText] = React.useState('A');
        Scheduler.log('App');
        return (
          <div>
            <Child
              text={text}
              onClick={() => {
                Scheduler.log('Clicked ' + text);
                setText('B');
              }}
            />
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

      assertLog(['App', 'B']);
    });

    it('resolves after content is hydrated with no boundary', async () => {
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
      const spanA = container.getElementsByTagName('span')[0];

      let hydrated = false;
      const root = ReactDOMClient.hydrateRoot(container, <App />);
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
    });
  });

  describe('with a boundary', () => {
    it('resolves immediately for already hydrated content', async () => {
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

      const hydrated = await root.unstable_scheduleHydration(spanA);
      expect(hydrated).toBe(undefined);
    });

    it('resolves after content is hydrated', async () => {
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
          </div>
        );
      }

      const finalHTML = ReactDOMServer.renderToString(<App />);
      assertLog(['App', 'A']);

      const container = document.createElement('div');
      container.innerHTML = finalHTML;
      const spanA = container.getElementsByTagName('span')[0];

      let hydrated = false;
      const root = ReactDOMClient.hydrateRoot(container, <App />);
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
    });
  });

  describe('with multiple boundaries', () => {
    it('resolve immediately for already hydrated content', async () => {
      function Child({text}) {
        Scheduler.log(text);
        return <span>{text}</span>;
      }

      function App() {
        Scheduler.log('App');
        return (
          <div>
            <Child text="A" />
            <Suspense fallback="Loading...">
              <Child text="B" />
            </Suspense>
            <Suspense fallback="Loading...">
              <Child text="C" />
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

      const hydratedA = await root.unstable_scheduleHydration(spanA);
      expect(hydratedA).toBe(undefined);

      // Hydrate everything else
      await waitForAll(['B', 'C']);

      const hydratedB = await root.unstable_scheduleHydration(spanB);
      expect(hydratedB).toBe(undefined);

      const hydratedC = await root.unstable_scheduleHydration(spanC);
      expect(hydratedC).toBe(undefined);
    });

    it('resolve after content is hydrated', async () => {
      function Child({text}) {
        Scheduler.log(text);
        return <span>{text}</span>;
      }

      function App() {
        Scheduler.log('App');
        return (
          <div>
            <Child text="A" />
            <Suspense fallback="Loading...">
              <Child text="B" />
            </Suspense>
            <Suspense fallback="Loading...">
              <Child text="C" />
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
      let hydratedB = false;
      let hydratedC = false;
      const scheduleHydrationA = root
        .unstable_scheduleHydration(spanA)
        .then(() => (hydratedA = true));
      const scheduleHydrationB = root
        .unstable_scheduleHydration(spanB)
        .then(() => {
          hydratedB = true;
        });
      const scheduleHydrationC = root
        .unstable_scheduleHydration(spanC)
        .then(() => (hydratedC = true));

      // Nothing has been hydrated so far.
      assertLog([]);
      expect(hydratedA).toBe(false);
      expect(hydratedB).toBe(false);
      expect(hydratedC).toBe(false);

      // Hydrate just A
      await waitForAll(['App', 'A', 'C', 'B']);

      await scheduleHydrationA;
      await scheduleHydrationB;
      await scheduleHydrationC;

      // Increase priority of B and then C.
      expect(hydratedA).toBe(true);
      expect(hydratedB).toBe(true);
      expect(hydratedC).toBe(true);
    });

    it('resolve out of order content', async () => {
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
            <Suspense fallback="Loading...">
              <Child text="C" />
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
      let hydratedB = false;
      let hydratedC = false;

      const scheduleHydrationB = root
        .unstable_scheduleHydration(spanB)
        .then(() => (hydratedB = true));
      const scheduleHydrationC = root
        .unstable_scheduleHydration(spanC)
        .then(() => (hydratedC = true));
      const scheduleHydrationA = root
        .unstable_scheduleHydration(spanA)
        .then(() => (hydratedA = true));

      // Nothing has been hydrated so far.
      assertLog([]);

      expect(hydratedA).toBe(false);
      expect(hydratedB).toBe(false);
      expect(hydratedC).toBe(false);

      await waitForAll(['App', 'A', 'C', 'B']);

      await scheduleHydrationA;
      await scheduleHydrationB;
      await scheduleHydrationC;

      expect(hydratedA).toBe(true);
      expect(hydratedB).toBe(true);
      expect(hydratedC).toBe(true);
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

      try {
        await root.unstable_scheduleHydration(undefined);
      } catch (e) {
        expect(e).toMatch('Cannot schedule hydration, target is undefined.');
      }

      expect.assertions(1);
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

      try {
        await root.unstable_scheduleHydration(nodeOutsideContainer);
      } catch (e) {
        expect(e).toMatch(
          'Cannot schedule hydration, target is not a React component.',
        );
      }

      expect.assertions(1);
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

      const spanA = container.getElementsByTagName('span')[0];
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

      await waitForAll(['B', 'B', 'A']);

      await hydrationPromise;

      expect(hydrationError).toMatch('Target was removed before hydration.');
    });

    it('resolves if target node is inside dangerouslySetInnerHTML', async () => {
      function App() {
        Scheduler.log('App');
        return <div dangerouslySetInnerHTML={{__html: '<span>A</span>'}}></div>;
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
      const hydrate = root
        .unstable_scheduleHydration(spanA)
        .then(() => (hydrated = true));

      try {
        await waitForAll(['B', 'B']);
      } catch (e) {
        //
      }

      await hydrate;

      expect(hydrated).toBe(true);
    });
  });
});
