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
let ReactDOMServer;
let Scheduler;
let ReactFeatureFlags;
let Suspense;
let SuspenseList;
let act;
let useHover;

function dispatchMouseEvent(to, from) {
  if (!to) {
    to = null;
  }
  if (!from) {
    from = null;
  }
  if (from) {
    const mouseOutEvent = document.createEvent('MouseEvents');
    mouseOutEvent.initMouseEvent(
      'mouseout',
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
      to,
    );
    from.dispatchEvent(mouseOutEvent);
  }
  if (to) {
    const mouseOverEvent = document.createEvent('MouseEvents');
    mouseOverEvent.initMouseEvent(
      'mouseover',
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
      from,
    );
    to.dispatchEvent(mouseOverEvent);
  }
}

describe('ReactDOMServerPartialHydration', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSuspenseServerRenderer = true;
    ReactFeatureFlags.enableSuspenseCallback = true;
    ReactFeatureFlags.enableFlareAPI = true;

    React = require('react');
    ReactDOM = require('react-dom');
    act = require('react-dom/test-utils').act;
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
    SuspenseList = React.unstable_SuspenseList;

    useHover = require('react-interactions/events/hover').useHover;
  });

  it('hydrates a parent even if a child Suspense boundary is blocked', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <span ref={ref}>
              <Child />
            </span>
          </Suspense>
        </div>
      );
    }

    // First we render the final HTML. With the streaming renderer
    // this may have suspense points on the server but here we want
    // to test the completed HTML. Don't suspend on the server.
    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);

    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    let span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref.current).toBe(null);

    // Resolving the promise should continue hydration
    suspend = false;
    resolve();
    await promise;
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We should now have hydrated with a ref on the existing span.
    expect(ref.current).toBe(span);
  });

  it('calls the hydration callbacks after hydration or deletion', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    let suspend2 = false;
    let promise2 = new Promise(() => {});
    function Child2() {
      if (suspend2) {
        throw promise2;
      } else {
        return 'World';
      }
    }

    function App({value}) {
      return (
        <div>
          <Suspense fallback="Loading...">
            <Child />
          </Suspense>
          <Suspense fallback="Loading...">
            <Child2 value={value} />
          </Suspense>
        </div>
      );
    }

    // First we render the final HTML. With the streaming renderer
    // this may have suspense points on the server but here we want
    // to test the completed HTML. Don't suspend on the server.
    suspend = false;
    suspend2 = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);

    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    let hydrated = [];
    let deleted = [];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    suspend2 = true;
    let root = ReactDOM.unstable_createRoot(container, {
      hydrate: true,
      hydrationOptions: {
        onHydrated(node) {
          hydrated.push(node);
        },
        onDeleted(node) {
          deleted.push(node);
        },
      },
    });
    act(() => {
      root.render(<App />);
    });

    expect(hydrated.length).toBe(0);
    expect(deleted.length).toBe(0);

    await act(async () => {
      // Resolving the promise should continue hydration
      suspend = false;
      resolve();
      await promise;
    });

    expect(hydrated.length).toBe(1);
    expect(deleted.length).toBe(0);

    // Performing an update should force it to delete the boundary
    root.render(<App value={true} />);

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(hydrated.length).toBe(1);
    expect(deleted.length).toBe(1);
  });

  it('calls the onDeleted hydration callback if the parent gets deleted', async () => {
    let suspend = false;
    let promise = new Promise(() => {});
    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    function App({deleted}) {
      if (deleted) {
        return null;
      }
      return (
        <div>
          <Suspense fallback="Loading...">
            <Child />
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);

    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    let deleted = [];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {
      hydrate: true,
      hydrationOptions: {
        onDeleted(node) {
          deleted.push(node);
        },
      },
    });
    act(() => {
      root.render(<App />);
    });

    expect(deleted.length).toBe(0);

    act(() => {
      root.render(<App deleted={true} />);
    });

    // The callback should have been invoked.
    expect(deleted.length).toBe(1);
  });

  it('warns and replaces the boundary content in legacy mode', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <span ref={ref}>
              <Child />
            </span>
          </Suspense>
        </div>
      );
    }

    // Don't suspend on the server.
    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);

    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    let span = container.getElementsByTagName('span')[0];

    // On the client we try to hydrate.
    suspend = true;
    expect(() => {
      act(() => {
        ReactDOM.hydrate(<App />, container);
      });
    }).toWarnDev(
      'Warning: Cannot hydrate Suspense in legacy mode. Switch from ' +
        'ReactDOM.hydrate(element, container) to ' +
        'ReactDOM.unstable_createSyncRoot(container, { hydrate: true })' +
        '.render(element) or remove the Suspense components from the server ' +
        'rendered components.' +
        '\n    in Suspense (at **)' +
        '\n    in div (at **)' +
        '\n    in App (at **)',
    );

    // We're now in loading state.
    expect(container.textContent).toBe('Loading...');

    let span2 = container.getElementsByTagName('span')[0];
    // This is a new node.
    expect(span).not.toBe(span2);
    expect(ref.current).toBe(span2);

    // Resolving the promise should render the final content.
    suspend = false;
    resolve();
    await promise;
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We should now have hydrated with a ref on the existing span.
    expect(container.textContent).toBe('Hello');
  });

  it('can insert siblings before the dehydrated boundary', () => {
    let suspend = false;
    let promise = new Promise(() => {});
    let showSibling;

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Second';
      }
    }

    function Sibling() {
      let [visible, setVisibilty] = React.useState(false);
      showSibling = () => setVisibilty(true);
      if (visible) {
        return <div>First</div>;
      }
      return null;
    }

    function App() {
      return (
        <div>
          <Sibling />
          <Suspense fallback="Loading...">
            <span>
              <Child />
            </span>
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;

    act(() => {
      let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
      root.render(<App />);
    });

    expect(container.firstChild.firstChild.tagName).not.toBe('DIV');

    // In this state, we can still update the siblings.
    act(() => showSibling());

    expect(container.firstChild.firstChild.tagName).toBe('DIV');
    expect(container.firstChild.firstChild.textContent).toBe('First');
  });

  it('can delete the dehydrated boundary before it is hydrated', () => {
    let suspend = false;
    let promise = new Promise(() => {});
    let hideMiddle;

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return (
          <>
            <div>Middle</div>
            Some text
          </>
        );
      }
    }

    function App() {
      let [visible, setVisibilty] = React.useState(true);
      hideMiddle = () => setVisibilty(false);

      return (
        <div>
          <div>Before</div>
          {visible ? (
            <Suspense fallback="Loading...">
              <Child />
            </Suspense>
          ) : null}
          <div>After</div>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    act(() => {
      let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
      root.render(<App />);
    });

    expect(container.firstChild.children[1].textContent).toBe('Middle');

    // In this state, we can still delete the boundary.
    act(() => hideMiddle());

    expect(container.firstChild.children[1].textContent).toBe('After');
  });

  it('blocks updates to hydrate the content first if props have changed', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();

    function Child({text}) {
      if (suspend) {
        throw promise;
      } else {
        return text;
      }
    }

    function App({text, className}) {
      return (
        <div>
          <Suspense fallback="Loading...">
            <span ref={ref} className={className}>
              <Child text={text} />
            </span>
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(
      <App text="Hello" className="hello" />,
    );
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    let span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App text="Hello" className="hello" />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref.current).toBe(null);
    expect(span.textContent).toBe('Hello');

    // Render an update, which will be higher or the same priority as pinging the hydration.
    root.render(<App text="Hi" className="hi" />);

    // At the same time, resolving the promise so that rendering can complete.
    suspend = false;
    resolve();
    await promise;

    // This should first complete the hydration and then flush the update onto the hydrated state.
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // The new span should be the same since we should have successfully hydrated
    // before changing it.
    let newSpan = container.getElementsByTagName('span')[0];
    expect(span).toBe(newSpan);

    // We should now have fully rendered with a ref on the new span.
    expect(ref.current).toBe(span);
    expect(span.textContent).toBe('Hi');
    // If we ended up hydrating the existing content, we won't have properly
    // patched up the tree, which might mean we haven't patched the className.
    expect(span.className).toBe('hi');
  });

  it('shows the fallback if props have changed before hydration completes and is still suspended', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();

    function Child({text}) {
      if (suspend) {
        throw promise;
      } else {
        return text;
      }
    }

    function App({text, className}) {
      return (
        <div>
          <Suspense fallback="Loading...">
            <span ref={ref} className={className}>
              <Child text={text} />
            </span>
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(
      <App text="Hello" className="hello" />,
    );
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App text="Hello" className="hello" />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref.current).toBe(null);

    // Render an update, but leave it still suspended.
    root.render(<App text="Hi" className="hi" />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // Flushing now should delete the existing content and show the fallback.

    expect(container.getElementsByTagName('span').length).toBe(0);
    expect(ref.current).toBe(null);
    expect(container.textContent).toBe('Loading...');

    // Unsuspending shows the content.
    suspend = false;
    resolve();
    await promise;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    let span = container.getElementsByTagName('span')[0];
    expect(span.textContent).toBe('Hi');
    expect(span.className).toBe('hi');
    expect(ref.current).toBe(span);
    expect(container.textContent).toBe('Hi');
  });

  it('shows the fallback of the outer if fallback is missing', async () => {
    // This is the same exact test as above but with a nested Suspense without a fallback.
    // This should be a noop.
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();

    function Child({text}) {
      if (suspend) {
        throw promise;
      } else {
        return text;
      }
    }

    function App({text, className}) {
      return (
        <div>
          <Suspense fallback="Loading...">
            <span ref={ref} className={className}>
              <Suspense>
                <Child text={text} />
              </Suspense>
            </span>
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(
      <App text="Hello" className="hello" />,
    );
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App text="Hello" className="hello" />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref.current).toBe(null);

    // Render an update, but leave it still suspended.
    root.render(<App text="Hi" className="hi" />);

    // Flushing now should delete the existing content and show the fallback.
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(container.getElementsByTagName('span').length).toBe(0);
    expect(ref.current).toBe(null);
    expect(container.textContent).toBe('Loading...');

    // Unsuspending shows the content.
    suspend = false;
    resolve();
    await promise;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    let span = container.getElementsByTagName('span')[0];
    expect(span.textContent).toBe('Hi');
    expect(span.className).toBe('hi');
    expect(ref.current).toBe(span);
    expect(container.textContent).toBe('Hi');
  });

  it('clears nested suspense boundaries if they did not hydrate yet', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();

    function Child({text}) {
      if (suspend) {
        throw promise;
      } else {
        return text;
      }
    }

    function App({text, className}) {
      return (
        <div>
          <Suspense fallback="Loading...">
            <Suspense fallback="Never happens">
              <Child text={text} />
            </Suspense>{' '}
            <span ref={ref} className={className}>
              <Child text={text} />
            </span>
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(
      <App text="Hello" className="hello" />,
    );
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App text="Hello" className="hello" />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref.current).toBe(null);

    // Render an update, but leave it still suspended.
    root.render(<App text="Hi" className="hi" />);

    // Flushing now should delete the existing content and show the fallback.
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(container.getElementsByTagName('span').length).toBe(0);
    expect(ref.current).toBe(null);
    expect(container.textContent).toBe('Loading...');

    // Unsuspending shows the content.
    suspend = false;
    resolve();
    await promise;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    let span = container.getElementsByTagName('span')[0];
    expect(span.textContent).toBe('Hi');
    expect(span.className).toBe('hi');
    expect(ref.current).toBe(span);
    expect(container.textContent).toBe('Hi Hi');
  });

  it('hydrates first if props changed but we are able to resolve within a timeout', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();

    function Child({text}) {
      if (suspend) {
        throw promise;
      } else {
        return text;
      }
    }

    function App({text, className}) {
      return (
        <div>
          <Suspense fallback="Loading...">
            <span ref={ref} className={className}>
              <Child text={text} />
            </span>
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(
      <App text="Hello" className="hello" />,
    );
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    let span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App text="Hello" className="hello" />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref.current).toBe(null);
    expect(container.textContent).toBe('Hello');

    // Render an update with a long timeout.
    React.unstable_withSuspenseConfig(
      () => root.render(<App text="Hi" className="hi" />),
      {timeoutMs: 5000},
    );

    // This shouldn't force the fallback yet.
    Scheduler.unstable_flushAll();

    expect(ref.current).toBe(null);
    expect(container.textContent).toBe('Hello');

    // Resolving the promise so that rendering can complete.
    suspend = false;
    resolve();
    await promise;

    // This should first complete the hydration and then flush the update onto the hydrated state.
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // The new span should be the same since we should have successfully hydrated
    // before changing it.
    let newSpan = container.getElementsByTagName('span')[0];
    expect(span).toBe(newSpan);

    // We should now have fully rendered with a ref on the new span.
    expect(ref.current).toBe(span);
    expect(container.textContent).toBe('Hi');
    // If we ended up hydrating the existing content, we won't have properly
    // patched up the tree, which might mean we haven't patched the className.
    expect(span.className).toBe('hi');
  });

  it('blocks the update to hydrate first if context has changed', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();
    let Context = React.createContext(null);

    function Child() {
      let {text, className} = React.useContext(Context);
      if (suspend) {
        throw promise;
      } else {
        return (
          <span ref={ref} className={className}>
            {text}
          </span>
        );
      }
    }

    const App = React.memo(function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <Child />
          </Suspense>
        </div>
      );
    });

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(
      <Context.Provider value={{text: 'Hello', className: 'hello'}}>
        <App />
      </Context.Provider>,
    );
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    let span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(
      <Context.Provider value={{text: 'Hello', className: 'hello'}}>
        <App />
      </Context.Provider>,
    );
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref.current).toBe(null);
    expect(span.textContent).toBe('Hello');

    // Render an update, which will be higher or the same priority as pinging the hydration.
    root.render(
      <Context.Provider value={{text: 'Hi', className: 'hi'}}>
        <App />
      </Context.Provider>,
    );

    // At the same time, resolving the promise so that rendering can complete.
    suspend = false;
    resolve();
    await promise;

    // This should first complete the hydration and then flush the update onto the hydrated state.
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // Since this should have been hydrated, this should still be the same span.
    let newSpan = container.getElementsByTagName('span')[0];
    expect(newSpan).toBe(span);

    // We should now have fully rendered with a ref on the new span.
    expect(ref.current).toBe(span);
    expect(span.textContent).toBe('Hi');
    // If we ended up hydrating the existing content, we won't have properly
    // patched up the tree, which might mean we haven't patched the className.
    expect(span.className).toBe('hi');
  });

  it('shows the fallback if context has changed before hydration completes and is still suspended', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();
    let Context = React.createContext(null);

    function Child() {
      let {text, className} = React.useContext(Context);
      if (suspend) {
        throw promise;
      } else {
        return (
          <span ref={ref} className={className}>
            {text}
          </span>
        );
      }
    }

    const App = React.memo(function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <Child />
          </Suspense>
        </div>
      );
    });

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(
      <Context.Provider value={{text: 'Hello', className: 'hello'}}>
        <App />
      </Context.Provider>,
    );
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(
      <Context.Provider value={{text: 'Hello', className: 'hello'}}>
        <App />
      </Context.Provider>,
    );
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref.current).toBe(null);

    // Render an update, but leave it still suspended.
    root.render(
      <Context.Provider value={{text: 'Hi', className: 'hi'}}>
        <App />
      </Context.Provider>,
    );

    // Flushing now should delete the existing content and show the fallback.
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(container.getElementsByTagName('span').length).toBe(0);
    expect(ref.current).toBe(null);
    expect(container.textContent).toBe('Loading...');

    // Unsuspending shows the content.
    suspend = false;
    resolve();
    await promise;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    let span = container.getElementsByTagName('span')[0];
    expect(span.textContent).toBe('Hi');
    expect(span.className).toBe('hi');
    expect(ref.current).toBe(span);
    expect(container.textContent).toBe('Hi');
  });

  it('replaces the fallback with client content if it is not rendered by the server', async () => {
    let suspend = false;
    let promise = new Promise(resolvePromise => {});
    let ref = React.createRef();

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <span ref={ref}>
              <Child />
            </span>
          </Suspense>
        </div>
      );
    }

    // First we render the final HTML. With the streaming renderer
    // this may have suspense points on the server but here we want
    // to test the completed HTML. Don't suspend on the server.
    suspend = true;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    expect(container.getElementsByTagName('span').length).toBe(0);

    // On the client we have the data available quickly for some reason.
    suspend = false;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(container.textContent).toBe('Hello');

    let span = container.getElementsByTagName('span')[0];
    expect(ref.current).toBe(span);
  });

  it('replaces the fallback within the suspended time if there is a nested suspense', async () => {
    let suspend = false;
    let promise = new Promise(resolvePromise => {});
    let ref = React.createRef();

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    function InnerChild() {
      // Always suspends indefinitely
      throw promise;
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <span ref={ref}>
              <Child />
            </span>
            <Suspense fallback={null}>
              <InnerChild />
            </Suspense>
          </Suspense>
        </div>
      );
    }

    // First we render the final HTML. With the streaming renderer
    // this may have suspense points on the server but here we want
    // to test the completed HTML. Don't suspend on the server.
    suspend = true;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    expect(container.getElementsByTagName('span').length).toBe(0);

    // On the client we have the data available quickly for some reason.
    suspend = false;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    // This will have exceeded the suspended time so we should timeout.
    jest.advanceTimersByTime(500);
    // The boundary should longer be suspended for the middle content
    // even though the inner boundary is still suspended.

    expect(container.textContent).toBe('Hello');

    let span = container.getElementsByTagName('span')[0];
    expect(ref.current).toBe(span);
  });

  it('replaces the fallback within the suspended time if there is a nested suspense in a nested suspense', async () => {
    let suspend = false;
    let promise = new Promise(resolvePromise => {});
    let ref = React.createRef();

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    function InnerChild() {
      // Always suspends indefinitely
      throw promise;
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Another layer">
            <Suspense fallback="Loading...">
              <span ref={ref}>
                <Child />
              </span>
              <Suspense fallback={null}>
                <InnerChild />
              </Suspense>
            </Suspense>
          </Suspense>
        </div>
      );
    }

    // First we render the final HTML. With the streaming renderer
    // this may have suspense points on the server but here we want
    // to test the completed HTML. Don't suspend on the server.
    suspend = true;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    expect(container.getElementsByTagName('span').length).toBe(0);

    // On the client we have the data available quickly for some reason.
    suspend = false;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    // This will have exceeded the suspended time so we should timeout.
    jest.advanceTimersByTime(500);
    // The boundary should longer be suspended for the middle content
    // even though the inner boundary is still suspended.

    expect(container.textContent).toBe('Hello');

    let span = container.getElementsByTagName('span')[0];
    expect(ref.current).toBe(span);
  });

  it('waits for pending content to come in from the server and then hydrates it', async () => {
    let suspend = false;
    let promise = new Promise(resolvePromise => {});
    let ref = React.createRef();

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <span ref={ref}>
              <Child />
            </span>
          </Suspense>
        </div>
      );
    }

    // We're going to simulate what Fizz will do during streaming rendering.

    // First we generate the HTML of the loading state.
    suspend = true;
    let loadingHTML = ReactDOMServer.renderToString(<App />);
    // Then we generate the HTML of the final content.
    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);

    let container = document.createElement('div');
    container.innerHTML = loadingHTML;

    let suspenseNode = container.firstChild.firstChild;
    expect(suspenseNode.nodeType).toBe(8);
    // Put the suspense node in hydration state.
    suspenseNode.data = '$?';

    // This will simulates new content streaming into the document and
    // replacing the fallback with final content.
    function streamInContent() {
      let temp = document.createElement('div');
      temp.innerHTML = finalHTML;
      let finalSuspenseNode = temp.firstChild.firstChild;
      let fallbackContent = suspenseNode.nextSibling;
      let finalContent = finalSuspenseNode.nextSibling;
      suspenseNode.parentNode.replaceChild(finalContent, fallbackContent);
      suspenseNode.data = '$';
      if (suspenseNode._reactRetry) {
        suspenseNode._reactRetry();
      }
    }

    // We're still showing a fallback.
    expect(container.getElementsByTagName('span').length).toBe(0);

    // Attempt to hydrate the content.
    suspend = false;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We're still loading because we're waiting for the server to stream more content.
    expect(container.textContent).toBe('Loading...');

    // The server now updates the content in place in the fallback.
    streamInContent();

    // The final HTML is now in place.
    expect(container.textContent).toBe('Hello');
    let span = container.getElementsByTagName('span')[0];

    // But it is not yet hydrated.
    expect(ref.current).toBe(null);

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // Now it's hydrated.
    expect(ref.current).toBe(span);
  });

  it('handles an error on the client if the server ends up erroring', async () => {
    let suspend = false;
    let promise = new Promise(resolvePromise => {});
    let ref = React.createRef();

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        throw new Error('Error Message');
      }
    }

    class ErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        return {error};
      }
      render() {
        if (this.state.error) {
          return <div ref={ref}>{this.state.error.message}</div>;
        }
        return this.props.children;
      }
    }

    function App() {
      return (
        <ErrorBoundary>
          <div>
            <Suspense fallback="Loading...">
              <span ref={ref}>
                <Child />
              </span>
            </Suspense>
          </div>
        </ErrorBoundary>
      );
    }

    // We're going to simulate what Fizz will do during streaming rendering.

    // First we generate the HTML of the loading state.
    suspend = true;
    let loadingHTML = ReactDOMServer.renderToString(<App />);

    let container = document.createElement('div');
    container.innerHTML = loadingHTML;

    let suspenseNode = container.firstChild.firstChild;
    expect(suspenseNode.nodeType).toBe(8);
    // Put the suspense node in hydration state.
    suspenseNode.data = '$?';

    // This will simulates the server erroring and putting the fallback
    // as the final state.
    function streamInError() {
      suspenseNode.data = '$!';
      if (suspenseNode._reactRetry) {
        suspenseNode._reactRetry();
      }
    }

    // We're still showing a fallback.
    expect(container.getElementsByTagName('span').length).toBe(0);

    // Attempt to hydrate the content.
    suspend = false;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We're still loading because we're waiting for the server to stream more content.
    expect(container.textContent).toBe('Loading...');

    // The server now updates the content in place in the fallback.
    streamInError();

    // The server errored, but we still haven't hydrated. We don't know if the
    // client will succeed yet, so we still show the loading state.
    expect(container.textContent).toBe('Loading...');
    expect(ref.current).toBe(null);

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // Hydrating should've generated an error and replaced the suspense boundary.
    expect(container.textContent).toBe('Error Message');

    let div = container.getElementsByTagName('div')[0];
    expect(ref.current).toBe(div);
  });

  it('shows inserted items in a SuspenseList before content is hydrated', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();

    function Child({children}) {
      if (suspend) {
        throw promise;
      } else {
        return children;
      }
    }

    // These are hoisted to avoid them from rerendering.
    const a = (
      <Suspense fallback="Loading A">
        <Child>
          <span>A</span>
        </Child>
      </Suspense>
    );
    const b = (
      <Suspense fallback="Loading B">
        <Child>
          <span ref={ref}>B</span>
        </Child>
      </Suspense>
    );

    function App({showMore}) {
      return (
        <SuspenseList revealOrder="forwards">
          {a}
          {b}
          {showMore ? (
            <Suspense fallback="Loading C">
              <span>C</span>
            </Suspense>
          ) : null}
        </SuspenseList>
      );
    }

    suspend = false;
    let html = ReactDOMServer.renderToString(<App showMore={false} />);

    let container = document.createElement('div');
    container.innerHTML = html;

    let spanB = container.getElementsByTagName('span')[1];

    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});

    suspend = true;
    act(() => {
      root.render(<App showMore={false} />);
    });

    // We're not hydrated yet.
    expect(ref.current).toBe(null);
    expect(container.textContent).toBe('AB');

    // Add more rows before we've hydrated the first two.
    act(() => {
      root.render(<App showMore={true} />);
    });

    // We're not hydrated yet.
    expect(ref.current).toBe(null);

    // Since the first two are already showing their final content
    // we should be able to show the real content.
    expect(container.textContent).toBe('ABC');

    suspend = false;
    await act(async () => {
      await resolve();
    });

    expect(container.textContent).toBe('ABC');
    // We've hydrated the same span.
    expect(ref.current).toBe(spanB);
  });

  it('shows is able to hydrate boundaries even if others in a list are pending', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();

    function Child({children}) {
      if (suspend) {
        throw promise;
      } else {
        return children;
      }
    }

    let promise2 = new Promise(() => {});
    function AlwaysSuspend() {
      throw promise2;
    }

    // This is hoisted to avoid them from rerendering.
    const a = (
      <Suspense fallback="Loading A">
        <Child>
          <span ref={ref}>A</span>
        </Child>
      </Suspense>
    );

    function App({showMore}) {
      return (
        <SuspenseList revealOrder="together">
          {a}
          {showMore ? (
            <Suspense fallback="Loading B">
              <AlwaysSuspend />
            </Suspense>
          ) : null}
        </SuspenseList>
      );
    }

    suspend = false;
    let html = ReactDOMServer.renderToString(<App showMore={false} />);

    let container = document.createElement('div');
    container.innerHTML = html;

    let spanA = container.getElementsByTagName('span')[0];

    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});

    suspend = true;
    act(() => {
      root.render(<App showMore={false} />);
    });

    // We're not hydrated yet.
    expect(ref.current).toBe(null);
    expect(container.textContent).toBe('A');

    await act(async () => {
      // Add another row before we've hydrated the first one.
      root.render(<App showMore={true} />);
      // At the same time, we resolve the blocking promise.
      suspend = false;
      await resolve();
    });

    // We should have been able to hydrate the first row.
    expect(ref.current).toBe(spanA);
    // Even though we're still slowing B.
    expect(container.textContent).toBe('ALoading B');
  });

  it('shows inserted items before pending in a SuspenseList as fallbacks', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));
    let ref = React.createRef();

    function Child({children}) {
      if (suspend) {
        throw promise;
      } else {
        return children;
      }
    }

    // These are hoisted to avoid them from rerendering.
    const a = (
      <Suspense fallback="Loading A">
        <Child>
          <span>A</span>
        </Child>
      </Suspense>
    );
    const b = (
      <Suspense fallback="Loading B">
        <Child>
          <span ref={ref}>B</span>
        </Child>
      </Suspense>
    );

    function App({showMore}) {
      return (
        <SuspenseList revealOrder="forwards">
          {a}
          {b}
          {showMore ? (
            <Suspense fallback="Loading C">
              <span>C</span>
            </Suspense>
          ) : null}
        </SuspenseList>
      );
    }

    suspend = false;
    let html = ReactDOMServer.renderToString(<App showMore={false} />);

    let container = document.createElement('div');
    container.innerHTML = html;

    let suspenseNode = container.firstChild;
    expect(suspenseNode.nodeType).toBe(8);
    // Put the suspense node in pending state.
    suspenseNode.data = '$?';

    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});

    suspend = true;
    act(() => {
      root.render(<App showMore={false} />);
    });

    // We're not hydrated yet.
    expect(ref.current).toBe(null);
    expect(container.textContent).toBe('AB');

    // Add more rows before we've hydrated the first two.
    act(() => {
      root.render(<App showMore={true} />);
    });

    // We're not hydrated yet.
    expect(ref.current).toBe(null);

    // Since the first two are already showing their final content
    // we should be able to show the real content.
    expect(container.textContent).toBe('ABLoading C');

    suspend = false;
    await act(async () => {
      // Resolve the boundary to be in its resolved final state.
      suspenseNode.data = '$';
      if (suspenseNode._reactRetry) {
        suspenseNode._reactRetry();
      }
      await resolve();
    });

    expect(container.textContent).toBe('ABC');
  });

  it('can client render nested boundaries', async () => {
    let suspend = false;
    let promise = new Promise(() => {});
    let ref = React.createRef();

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    function App() {
      return (
        <div>
          <Suspense
            fallback={
              <>
                <Suspense fallback="Loading...">
                  <Child />
                </Suspense>
                <span>Inner Sibling</span>
              </>
            }>
            <Child />
          </Suspense>
          <span ref={ref}>Sibling</span>
        </div>
      );
    }

    suspend = true;
    let html = ReactDOMServer.renderToString(<App />);

    let container = document.createElement('div');
    container.innerHTML = html + '<!--unrelated comment-->';

    let span = container.getElementsByTagName('span')[1];

    suspend = false;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref.current).toBe(span);
    expect(span.parentNode).not.toBe(null);

    // It leaves non-React comments alone.
    expect(container.lastChild.nodeType).toBe(8);
    expect(container.lastChild.data).toBe('unrelated comment');
  });

  it('can hydrate TWO suspense boundaries', async () => {
    let ref1 = React.createRef();
    let ref2 = React.createRef();

    function App() {
      return (
        <div>
          <Suspense fallback="Loading 1...">
            <span ref={ref1}>1</span>
          </Suspense>
          <Suspense fallback="Loading 2...">
            <span ref={ref2}>2</span>
          </Suspense>
        </div>
      );
    }

    // First we render the final HTML. With the streaming renderer
    // this may have suspense points on the server but here we want
    // to test the completed HTML. Don't suspend on the server.
    let finalHTML = ReactDOMServer.renderToString(<App />);

    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    let span1 = container.getElementsByTagName('span')[0];
    let span2 = container.getElementsByTagName('span')[1];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref1.current).toBe(span1);
    expect(ref2.current).toBe(span2);
  });

  it('regenerates if it cannot hydrate before changes to props/context expire', async () => {
    let suspend = false;
    let promise = new Promise(resolvePromise => {});
    let ref = React.createRef();
    let ClassName = React.createContext(null);

    function Child({text}) {
      let className = React.useContext(ClassName);
      if (suspend && className !== 'hi' && text !== 'Hi') {
        // Never suspends on the newer data.
        throw promise;
      } else {
        return (
          <span ref={ref} className={className}>
            {text}
          </span>
        );
      }
    }

    function App({text, className}) {
      return (
        <div>
          <Suspense fallback="Loading...">
            <Child text={text} />
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(
      <ClassName.Provider value={'hello'}>
        <App text="Hello" />
      </ClassName.Provider>,
    );
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    let span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(
      <ClassName.Provider value={'hello'}>
        <App text="Hello" />
      </ClassName.Provider>,
    );
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref.current).toBe(null);
    expect(span.textContent).toBe('Hello');

    // Render an update, which will be higher or the same priority as pinging the hydration.
    // The new update doesn't suspend.
    root.render(
      <ClassName.Provider value={'hi'}>
        <App text="Hi" />
      </ClassName.Provider>,
    );

    // Since we're still suspended on the original data, we can't hydrate.
    // This will force all expiration times to flush.
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // This will now be a new span because we weren't able to hydrate before
    let newSpan = container.getElementsByTagName('span')[0];
    expect(newSpan).not.toBe(span);

    // We should now have fully rendered with a ref on the new span.
    expect(ref.current).toBe(newSpan);
    expect(newSpan.textContent).toBe('Hi');
    // If we ended up hydrating the existing content, we won't have properly
    // patched up the tree, which might mean we haven't patched the className.
    expect(newSpan.className).toBe('hi');
  });

  it('does not invoke an event on a hydrated node until it commits', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));

    function Sibling({text}) {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    let clicks = 0;

    function Button() {
      let [clicked, setClicked] = React.useState(false);
      if (clicked) {
        return null;
      }
      return (
        <a
          onClick={() => {
            setClicked(true);
            clicks++;
          }}>
          Click me
        </a>
      );
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <Button />
            <Sibling />
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    let a = container.getElementsByTagName('a')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(container.textContent).toBe('Click meHello');

    // We're now partially hydrated.
    a.click();
    expect(clicks).toBe(0);

    // Resolving the promise so that rendering can complete.
    suspend = false;
    resolve();
    await promise;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(clicks).toBe(1);

    expect(container.textContent).toBe('Hello');

    document.body.removeChild(container);
  });

  it('does not invoke an event on a hydrated EventResponder until it commits', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));

    function Sibling({text}) {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    const onEvent = jest.fn();
    const TestResponder = React.unstable_createResponder('TestEventResponder', {
      targetEventTypes: ['click'],
      onEvent,
    });

    function Button() {
      let listener = React.unstable_useResponder(TestResponder, {});
      return <a listeners={listener}>Click me</a>;
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <Button />
            <Sibling />
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    let a = container.getElementsByTagName('a')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);

    // We'll do one click before hydrating.
    a.click();
    // This should be delayed.
    expect(onEvent).toHaveBeenCalledTimes(0);

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We're now partially hydrated.
    a.click();
    // We should not have invoked the event yet because we're not
    // yet hydrated.
    expect(onEvent).toHaveBeenCalledTimes(0);

    // Resolving the promise so that rendering can complete.
    suspend = false;
    resolve();
    await promise;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(onEvent).toHaveBeenCalledTimes(2);

    document.body.removeChild(container);
  });

  it('invokes discrete events on nested suspense boundaries in a root (legacy system)', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));

    let clicks = 0;

    function Button() {
      return (
        <a
          onClick={() => {
            clicks++;
          }}>
          Click me
        </a>
      );
    }

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return (
          <Suspense fallback="Loading...">
            <Button />
          </Suspense>
        );
      }
    }

    function App() {
      return (
        <Suspense fallback="Loading...">
          <Child />
        </Suspense>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    let a = container.getElementsByTagName('a')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);

    // We'll do one click before hydrating.
    a.click();
    // This should be delayed.
    expect(clicks).toBe(0);

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We're now partially hydrated.
    a.click();
    expect(clicks).toBe(0);

    // Resolving the promise so that rendering can complete.
    suspend = false;
    resolve();
    await promise;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(clicks).toBe(2);

    document.body.removeChild(container);
  });

  it('invokes discrete events on nested suspense boundaries in a root (responder system)', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));

    const onEvent = jest.fn();
    const TestResponder = React.unstable_createResponder('TestEventResponder', {
      targetEventTypes: ['click'],
      onEvent,
    });

    function Button() {
      let listener = React.unstable_useResponder(TestResponder, {});
      return <a listeners={listener}>Click me</a>;
    }

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return (
          <Suspense fallback="Loading...">
            <Button />
          </Suspense>
        );
      }
    }

    function App() {
      return (
        <Suspense fallback="Loading...">
          <Child />
        </Suspense>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    let a = container.getElementsByTagName('a')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);

    // We'll do one click before hydrating.
    a.click();
    // This should be delayed.
    expect(onEvent).toHaveBeenCalledTimes(0);

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We're now partially hydrated.
    a.click();
    // We should not have invoked the event yet because we're not
    // yet hydrated.
    expect(onEvent).toHaveBeenCalledTimes(0);

    // Resolving the promise so that rendering can complete.
    suspend = false;
    resolve();
    await promise;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(onEvent).toHaveBeenCalledTimes(2);

    document.body.removeChild(container);
  });

  it('does not invoke the parent of dehydrated boundary event', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));

    let clicksOnParent = 0;
    let clicksOnChild = 0;

    function Child({text}) {
      if (suspend) {
        throw promise;
      } else {
        return (
          <span
            onClick={e => {
              // The stopPropagation is showing an example why invoking
              // the event on only a parent might not be correct.
              e.stopPropagation();
              clicksOnChild++;
            }}>
            Hello
          </span>
        );
      }
    }

    function App() {
      return (
        <div onClick={() => clicksOnParent++}>
          <Suspense fallback="Loading...">
            <Child />
          </Suspense>
        </div>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    let span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We're now partially hydrated.
    span.click();
    expect(clicksOnChild).toBe(0);
    expect(clicksOnParent).toBe(0);

    // Resolving the promise so that rendering can complete.
    suspend = false;
    resolve();
    await promise;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(clicksOnChild).toBe(1);
    // This will be zero due to the stopPropagation.
    expect(clicksOnParent).toBe(0);

    document.body.removeChild(container);
  });

  it('does not invoke an event on a parent tree when a subtree is dehydrated', async () => {
    let suspend = false;
    let resolve;
    let promise = new Promise(resolvePromise => (resolve = resolvePromise));

    let clicks = 0;
    let childSlotRef = React.createRef();

    function Parent() {
      return <div onClick={() => clicks++} ref={childSlotRef} />;
    }

    function Child({text}) {
      if (suspend) {
        throw promise;
      } else {
        return <a>Click me</a>;
      }
    }

    function App() {
      // The root is a Suspense boundary.
      return (
        <Suspense fallback="Loading...">
          <Child />
        </Suspense>
      );
    }

    suspend = false;
    let finalHTML = ReactDOMServer.renderToString(<App />);

    let parentContainer = document.createElement('div');
    let childContainer = document.createElement('div');

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(parentContainer);

    // We're going to use a different root as a parent.
    // This lets us detect whether an event goes through React's event system.
    let parentRoot = ReactDOM.unstable_createRoot(parentContainer);
    parentRoot.render(<Parent />);
    Scheduler.unstable_flushAll();

    childSlotRef.current.appendChild(childContainer);

    childContainer.innerHTML = finalHTML;

    let a = childContainer.getElementsByTagName('a')[0];

    suspend = true;

    // Hydrate asynchronously.
    let root = ReactDOM.unstable_createRoot(childContainer, {hydrate: true});
    root.render(<App />);
    jest.runAllTimers();
    Scheduler.unstable_flushAll();

    // The Suspense boundary is not yet hydrated.
    a.click();
    expect(clicks).toBe(0);

    // Resolving the promise so that rendering can complete.
    suspend = false;
    resolve();
    await promise;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We're now full hydrated.

    expect(clicks).toBe(1);

    document.body.removeChild(parentContainer);
  });

  it('blocks only on the last continuous event (legacy system)', async () => {
    let suspend1 = false;
    let resolve1;
    let promise1 = new Promise(resolvePromise => (resolve1 = resolvePromise));
    let suspend2 = false;
    let resolve2;
    let promise2 = new Promise(resolvePromise => (resolve2 = resolvePromise));

    function First({text}) {
      if (suspend1) {
        throw promise1;
      } else {
        return 'Hello';
      }
    }

    function Second({text}) {
      if (suspend2) {
        throw promise2;
      } else {
        return 'World';
      }
    }

    let ops = [];

    function App() {
      return (
        <div>
          <Suspense fallback="Loading First...">
            <span
              onMouseEnter={() => ops.push('Mouse Enter First')}
              onMouseLeave={() => ops.push('Mouse Leave First')}
            />
            {/* We suspend after to test what happens when we eager
                attach the listener. */}
            <First />
          </Suspense>
          <Suspense fallback="Loading Second...">
            <span
              onMouseEnter={() => ops.push('Mouse Enter Second')}
              onMouseLeave={() => ops.push('Mouse Leave Second')}>
              <Second />
            </span>
          </Suspense>
        </div>
      );
    }

    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    let appDiv = container.getElementsByTagName('div')[0];
    let firstSpan = appDiv.getElementsByTagName('span')[0];
    let secondSpan = appDiv.getElementsByTagName('span')[1];
    expect(firstSpan.textContent).toBe('');
    expect(secondSpan.textContent).toBe('World');

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend1 = true;
    suspend2 = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    dispatchMouseEvent(appDiv, null);
    dispatchMouseEvent(firstSpan, appDiv);
    dispatchMouseEvent(secondSpan, firstSpan);

    // Neither target is yet hydrated.
    expect(ops).toEqual([]);

    // Resolving the second promise so that rendering can complete.
    suspend2 = false;
    resolve2();
    await promise2;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We've unblocked the current hover target so we should be
    // able to replay it now.
    expect(ops).toEqual(['Mouse Enter Second']);

    // Resolving the first promise has no effect now.
    suspend1 = false;
    resolve1();
    await promise1;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ops).toEqual(['Mouse Enter Second']);

    document.body.removeChild(container);
  });

  it('blocks only on the last continuous event (Responder system)', async () => {
    let suspend1 = false;
    let resolve1;
    let promise1 = new Promise(resolvePromise => (resolve1 = resolvePromise));
    let suspend2 = false;
    let resolve2;
    let promise2 = new Promise(resolvePromise => (resolve2 = resolvePromise));

    function First({text}) {
      if (suspend1) {
        throw promise1;
      } else {
        return 'Hello';
      }
    }

    function Second({text}) {
      if (suspend2) {
        throw promise2;
      } else {
        return 'World';
      }
    }

    let ops = [];

    function App() {
      const listener1 = useHover({
        onHoverStart() {
          ops.push('Hover Start First');
        },
        onHoverEnd() {
          ops.push('Hover End First');
        },
      });
      const listener2 = useHover({
        onHoverStart() {
          ops.push('Hover Start Second');
        },
        onHoverEnd() {
          ops.push('Hover End Second');
        },
      });
      return (
        <div>
          <Suspense fallback="Loading First...">
            <span listeners={listener1} />
            {/* We suspend after to test what happens when we eager
                attach the listener. */}
            <First />
          </Suspense>
          <Suspense fallback="Loading Second...">
            <span listeners={listener2}>
              <Second />
            </span>
          </Suspense>
        </div>
      );
    }

    let finalHTML = ReactDOMServer.renderToString(<App />);
    let container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    let appDiv = container.getElementsByTagName('div')[0];
    let firstSpan = appDiv.getElementsByTagName('span')[0];
    let secondSpan = appDiv.getElementsByTagName('span')[1];
    expect(firstSpan.textContent).toBe('');
    expect(secondSpan.textContent).toBe('World');

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend1 = true;
    suspend2 = true;
    let root = ReactDOM.unstable_createRoot(container, {hydrate: true});
    root.render(<App />);

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    dispatchMouseEvent(appDiv, null);
    dispatchMouseEvent(firstSpan, appDiv);
    dispatchMouseEvent(secondSpan, firstSpan);

    // Neither target is yet hydrated.
    expect(ops).toEqual([]);

    // Resolving the second promise so that rendering can complete.
    suspend2 = false;
    resolve2();
    await promise2;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We've unblocked the current hover target so we should be
    // able to replay it now.
    expect(ops).toEqual(['Hover Start Second']);

    // Resolving the first promise has no effect now.
    suspend1 = false;
    resolve1();
    await promise1;

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ops).toEqual(['Hover Start Second']);

    document.body.removeChild(container);
  });
});
