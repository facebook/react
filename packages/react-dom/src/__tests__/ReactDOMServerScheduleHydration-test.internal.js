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
let ReactDOM;
let ReactDOMClient;
let ReactDOMServer;
let Scheduler;
let Suspense;
let assertLog;
let waitForAll;
let waitFor;

describe('ReactDOMServerScheduleHydration', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;

    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;
    waitForAll = InternalTestUtils.waitForAll;
    waitFor = InternalTestUtils.waitFor;
  });

  describe('with no boundary', () => {
    it('resolves immediately for already hydrated content with no boundary', async () => {
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

      const root = ReactDOMClient.hydrateRoot(container, <App />);

      // Nothing has been hydrated so far.
      assertLog([]);

      // Hydrate everything
      await waitForAll(['App', 'A']);

      const hydrated = await root.unstable_scheduleHydration(spanA);
      expect(hydrated).toBe(true);
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
      expect(hydrated).toBe(true);
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
      expect(hydratedA).toBe(true);

      // Hydrate everything else
      await waitForAll(['B', 'C']);

      const hydratedB = await root.unstable_scheduleHydration(spanB);
      expect(hydratedB).toBe(true);

      const hydratedC = await root.unstable_scheduleHydration(spanC);
      expect(hydratedC).toBe(true);
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
          console.log('A');
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
});
