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
    ReactFeatureFlags.enableSuspenseCallback = true;
    ReactFeatureFlags.enableDeprecatedFlareAPI = true;

    React = require('react');
    ReactDOM = require('react-dom');
    act = require('react-dom/test-utils').act;
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
    SuspenseList = React.SuspenseList;
  });

  // @gate experimental
  it('hydrates a parent even if a child Suspense boundary is blocked', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

  // @gate experimental
  it('calls the hydration callbacks after hydration or deletion', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    let suspend2 = false;
    const promise2 = new Promise(() => {});
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
    const finalHTML = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const hydrated = [];
    const deleted = [];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    suspend2 = true;
    const root = ReactDOM.createRoot(container, {
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

  // @gate experimental
  it('calls the onDeleted hydration callback if the parent gets deleted', async () => {
    let suspend = false;
    const promise = new Promise(() => {});
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
    const finalHTML = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const deleted = [];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {
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

  // @gate experimental || www
  it('warns and replaces the boundary content in legacy mode', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[0];

    // On the client we try to hydrate.
    suspend = true;
    expect(() => {
      act(() => {
        ReactDOM.hydrate(<App />, container);
      });
    }).toErrorDev(
      'Warning: Cannot hydrate Suspense in legacy mode. Switch from ' +
        'ReactDOM.hydrate(element, container) to ' +
        'ReactDOM.createBlockingRoot(container, { hydrate: true })' +
        '.render(element) or remove the Suspense components from the server ' +
        'rendered components.' +
        '\n    in Suspense (at **)' +
        '\n    in div (at **)' +
        '\n    in App (at **)',
    );

    // We're now in loading state.
    expect(container.textContent).toBe('Loading...');

    const span2 = container.getElementsByTagName('span')[0];
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

  // @gate experimental
  it('can insert siblings before the dehydrated boundary', () => {
    let suspend = false;
    const promise = new Promise(() => {});
    let showSibling;

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        return 'Second';
      }
    }

    function Sibling() {
      const [visible, setVisibilty] = React.useState(false);
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
    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;

    act(() => {
      const root = ReactDOM.createRoot(container, {hydrate: true});
      root.render(<App />);
    });

    expect(container.firstChild.firstChild.tagName).not.toBe('DIV');

    // In this state, we can still update the siblings.
    act(() => showSibling());

    expect(container.firstChild.firstChild.tagName).toBe('DIV');
    expect(container.firstChild.firstChild.textContent).toBe('First');
  });

  // @gate experimental
  it('can delete the dehydrated boundary before it is hydrated', () => {
    let suspend = false;
    const promise = new Promise(() => {});
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
      const [visible, setVisibilty] = React.useState(true);
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
    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    act(() => {
      const root = ReactDOM.createRoot(container, {hydrate: true});
      root.render(<App />);
    });

    expect(container.firstChild.children[1].textContent).toBe('Middle');

    // In this state, we can still delete the boundary.
    act(() => hideMiddle());

    expect(container.firstChild.children[1].textContent).toBe('After');
  });

  // @gate experimental
  it('blocks updates to hydrate the content first if props have changed', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(
      <App text="Hello" className="hello" />,
    );
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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
    const newSpan = container.getElementsByTagName('span')[0];
    expect(span).toBe(newSpan);

    // We should now have fully rendered with a ref on the new span.
    expect(ref.current).toBe(span);
    expect(span.textContent).toBe('Hi');
    // If we ended up hydrating the existing content, we won't have properly
    // patched up the tree, which might mean we haven't patched the className.
    expect(span.className).toBe('hi');
  });

  // @gate experimental
  it('shows the fallback if props have changed before hydration completes and is still suspended', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(
      <App text="Hello" className="hello" />,
    );
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

    const span = container.getElementsByTagName('span')[0];
    expect(span.textContent).toBe('Hi');
    expect(span.className).toBe('hi');
    expect(ref.current).toBe(span);
    expect(container.textContent).toBe('Hi');
  });

  // @gate experimental
  it('shows the fallback of the outer if fallback is missing', async () => {
    // This is the same exact test as above but with a nested Suspense without a fallback.
    // This should be a noop.
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(
      <App text="Hello" className="hello" />,
    );
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

    const span = container.getElementsByTagName('span')[0];
    expect(span.textContent).toBe('Hi');
    expect(span.className).toBe('hi');
    expect(ref.current).toBe(span);
    expect(container.textContent).toBe('Hi');
  });

  // @gate experimental
  it('clears nested suspense boundaries if they did not hydrate yet', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(
      <App text="Hello" className="hello" />,
    );
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

    const span = container.getElementsByTagName('span')[0];
    expect(span.textContent).toBe('Hi');
    expect(span.className).toBe('hi');
    expect(ref.current).toBe(span);
    expect(container.textContent).toBe('Hi Hi');
  });

  // @gate experimental
  it('hydrates first if props changed but we are able to resolve within a timeout', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(
      <App text="Hello" className="hello" />,
    );
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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
    const newSpan = container.getElementsByTagName('span')[0];
    expect(span).toBe(newSpan);

    // We should now have fully rendered with a ref on the new span.
    expect(ref.current).toBe(span);
    expect(container.textContent).toBe('Hi');
    // If we ended up hydrating the existing content, we won't have properly
    // patched up the tree, which might mean we haven't patched the className.
    expect(span.className).toBe('hi');
  });

  // @gate experimental
  it('warns but works if setState is called before commit in a dehydrated component', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

    let updateText;

    function Child() {
      const [state, setState] = React.useState('Hello');
      updateText = setState;
      Scheduler.unstable_yieldValue('Child');
      if (suspend) {
        throw promise;
      } else {
        return state;
      }
    }

    function Sibling() {
      Scheduler.unstable_yieldValue('Sibling');
      return null;
    }

    function App() {
      return (
        <div>
          <Suspense fallback="Loading...">
            <Child />
            <Sibling />
          </Suspense>
        </div>
      );
    }

    suspend = false;
    const finalHTML = ReactDOMServer.renderToString(<App />);
    expect(Scheduler).toHaveYielded(['Child', 'Sibling']);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const root = ReactDOM.createRoot(container, {hydrate: true});

    await act(async () => {
      suspend = true;
      root.render(<App />);
      expect(Scheduler).toFlushAndYieldThrough(['Child']);

      // While we're part way through the hydration, we update the state.
      // This will schedule an update on the children of the suspense boundary.
      expect(() => updateText('Hi')).toErrorDev(
        "Can't perform a React state update on a component that hasn't mounted yet.",
      );

      // This will throw it away and rerender.
      expect(Scheduler).toFlushAndYield(['Child', 'Sibling']);

      expect(container.textContent).toBe('Hello');

      suspend = false;
      resolve();
      await promise;
    });
    expect(Scheduler).toHaveYielded(['Child', 'Sibling']);

    expect(container.textContent).toBe('Hello');
  });

  // @gate experimental
  it('blocks the update to hydrate first if context has changed', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();
    const Context = React.createContext(null);

    function Child() {
      const {text, className} = React.useContext(Context);
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
    const finalHTML = ReactDOMServer.renderToString(
      <Context.Provider value={{text: 'Hello', className: 'hello'}}>
        <App />
      </Context.Provider>,
    );
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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
    const newSpan = container.getElementsByTagName('span')[0];
    expect(newSpan).toBe(span);

    // We should now have fully rendered with a ref on the new span.
    expect(ref.current).toBe(span);
    expect(span.textContent).toBe('Hi');
    // If we ended up hydrating the existing content, we won't have properly
    // patched up the tree, which might mean we haven't patched the className.
    expect(span.className).toBe('hi');
  });

  // @gate experimental
  it('shows the fallback if context has changed before hydration completes and is still suspended', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();
    const Context = React.createContext(null);

    function Child() {
      const {text, className} = React.useContext(Context);
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
    const finalHTML = ReactDOMServer.renderToString(
      <Context.Provider value={{text: 'Hello', className: 'hello'}}>
        <App />
      </Context.Provider>,
    );
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

    const span = container.getElementsByTagName('span')[0];
    expect(span.textContent).toBe('Hi');
    expect(span.className).toBe('hi');
    expect(ref.current).toBe(span);
    expect(container.textContent).toBe('Hi');
  });

  // @gate experimental
  it('replaces the fallback with client content if it is not rendered by the server', async () => {
    let suspend = false;
    const promise = new Promise(resolvePromise => {});
    const ref = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    expect(container.getElementsByTagName('span').length).toBe(0);

    // On the client we have the data available quickly for some reason.
    suspend = false;
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(container.textContent).toBe('Hello');

    const span = container.getElementsByTagName('span')[0];
    expect(ref.current).toBe(span);
  });

  // @gate experimental
  it('replaces the fallback within the suspended time if there is a nested suspense', async () => {
    let suspend = false;
    const promise = new Promise(resolvePromise => {});
    const ref = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    expect(container.getElementsByTagName('span').length).toBe(0);

    // On the client we have the data available quickly for some reason.
    suspend = false;
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    // This will have exceeded the suspended time so we should timeout.
    jest.advanceTimersByTime(500);
    // The boundary should longer be suspended for the middle content
    // even though the inner boundary is still suspended.

    expect(container.textContent).toBe('Hello');

    const span = container.getElementsByTagName('span')[0];
    expect(ref.current).toBe(span);
  });

  // @gate experimental
  it('replaces the fallback within the suspended time if there is a nested suspense in a nested suspense', async () => {
    let suspend = false;
    const promise = new Promise(resolvePromise => {});
    const ref = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    expect(container.getElementsByTagName('span').length).toBe(0);

    // On the client we have the data available quickly for some reason.
    suspend = false;
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    // This will have exceeded the suspended time so we should timeout.
    jest.advanceTimersByTime(500);
    // The boundary should longer be suspended for the middle content
    // even though the inner boundary is still suspended.

    expect(container.textContent).toBe('Hello');

    const span = container.getElementsByTagName('span')[0];
    expect(ref.current).toBe(span);
  });

  // @gate experimental
  it('waits for pending content to come in from the server and then hydrates it', async () => {
    let suspend = false;
    const promise = new Promise(resolvePromise => {});
    const ref = React.createRef();

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
    const loadingHTML = ReactDOMServer.renderToString(<App />);
    // Then we generate the HTML of the final content.
    suspend = false;
    const finalHTML = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = loadingHTML;

    const suspenseNode = container.firstChild.firstChild;
    expect(suspenseNode.nodeType).toBe(8);
    // Put the suspense node in hydration state.
    suspenseNode.data = '$?';

    // This will simulates new content streaming into the document and
    // replacing the fallback with final content.
    function streamInContent() {
      const temp = document.createElement('div');
      temp.innerHTML = finalHTML;
      const finalSuspenseNode = temp.firstChild.firstChild;
      const fallbackContent = suspenseNode.nextSibling;
      const finalContent = finalSuspenseNode.nextSibling;
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
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // We're still loading because we're waiting for the server to stream more content.
    expect(container.textContent).toBe('Loading...');

    // The server now updates the content in place in the fallback.
    streamInContent();

    // The final HTML is now in place.
    expect(container.textContent).toBe('Hello');
    const span = container.getElementsByTagName('span')[0];

    // But it is not yet hydrated.
    expect(ref.current).toBe(null);

    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // Now it's hydrated.
    expect(ref.current).toBe(span);
  });

  // @gate experimental
  it('handles an error on the client if the server ends up erroring', async () => {
    let suspend = false;
    const promise = new Promise(resolvePromise => {});
    const ref = React.createRef();

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
    const loadingHTML = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = loadingHTML;

    const suspenseNode = container.firstChild.firstChild;
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
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

    const div = container.getElementsByTagName('div')[0];
    expect(ref.current).toBe(div);
  });

  // @gate experimental
  it('shows inserted items in a SuspenseList before content is hydrated', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();

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
    const html = ReactDOMServer.renderToString(<App showMore={false} />);

    const container = document.createElement('div');
    container.innerHTML = html;

    const spanB = container.getElementsByTagName('span')[1];

    const root = ReactDOM.createRoot(container, {hydrate: true});

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

  // @gate experimental
  it('shows is able to hydrate boundaries even if others in a list are pending', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();

    function Child({children}) {
      if (suspend) {
        throw promise;
      } else {
        return children;
      }
    }

    const promise2 = new Promise(() => {});
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
    const html = ReactDOMServer.renderToString(<App showMore={false} />);

    const container = document.createElement('div');
    container.innerHTML = html;

    const spanA = container.getElementsByTagName('span')[0];

    const root = ReactDOM.createRoot(container, {hydrate: true});

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

  // @gate experimental
  it('shows inserted items before pending in a SuspenseList as fallbacks', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();

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
    const html = ReactDOMServer.renderToString(<App showMore={false} />);

    const container = document.createElement('div');
    container.innerHTML = html;

    const suspenseNode = container.firstChild;
    expect(suspenseNode.nodeType).toBe(8);
    // Put the suspense node in pending state.
    suspenseNode.data = '$?';

    const root = ReactDOM.createRoot(container, {hydrate: true});

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

  // @gate experimental
  it('clears server boundaries when SuspenseList runs out of time hydrating', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

    const ref = React.createRef();

    function Child({children}) {
      if (suspend) {
        throw promise;
      } else {
        return children;
      }
    }

    function Before() {
      Scheduler.unstable_yieldValue('Before');
      return null;
    }

    function After() {
      Scheduler.unstable_yieldValue('After');
      return null;
    }

    function FirstRow() {
      return (
        <>
          <Before />
          <Suspense fallback="Loading A">
            <span>A</span>
          </Suspense>
          <After />
        </>
      );
    }

    function App() {
      return (
        <Suspense fallback={null}>
          <SuspenseList revealOrder="forwards" tail="hidden">
            <FirstRow />
            <Suspense fallback="Loading B">
              <Child>
                <span ref={ref}>B</span>
              </Child>
            </Suspense>
          </SuspenseList>
        </Suspense>
      );
    }

    suspend = false;
    const html = ReactDOMServer.renderToString(<App />);
    expect(Scheduler).toHaveYielded(['Before', 'After']);

    const container = document.createElement('div');
    container.innerHTML = html;

    const b = container.getElementsByTagName('span')[1];
    expect(b.textContent).toBe('B');

    const root = ReactDOM.createRoot(container, {hydrate: true});

    // Increase hydration priority to higher than "offscreen".
    ReactDOM.unstable_scheduleHydration(b);

    suspend = true;

    await act(async () => {
      root.render(<App />);
      expect(Scheduler).toFlushAndYieldThrough(['Before']);
      // This took a long time to render.
      Scheduler.unstable_advanceTime(1000);
      expect(Scheduler).toFlushAndYield(['After']);
      // This will cause us to skip the second row completely.
    });

    // We haven't hydrated the second child but the placeholder is still in the list.
    expect(ref.current).toBe(null);
    expect(container.textContent).toBe('AB');

    suspend = false;
    await act(async () => {
      // Resolve the boundary to be in its resolved final state.
      await resolve();
    });

    expect(container.textContent).toBe('AB');
    expect(ref.current).toBe(b);
  });

  // @gate experimental
  it('clears server boundaries when SuspenseList suspends last row hydrating', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

    function Child({children}) {
      if (suspend) {
        throw promise;
      } else {
        return children;
      }
    }

    function App() {
      return (
        <Suspense fallback={null}>
          <SuspenseList revealOrder="forwards" tail="hidden">
            <Suspense fallback="Loading A">
              <span>A</span>
            </Suspense>
            <Suspense fallback="Loading B">
              <Child>
                <span>B</span>
              </Child>
            </Suspense>
          </SuspenseList>
        </Suspense>
      );
    }

    suspend = true;
    const html = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = html;

    const root = ReactDOM.createRoot(container, {hydrate: true});

    suspend = true;

    await act(async () => {
      root.render(<App />);
    });

    // We haven't hydrated the second child but the placeholder is still in the list.
    expect(container.textContent).toBe('ALoading B');

    suspend = false;
    await act(async () => {
      // Resolve the boundary to be in its resolved final state.
      await resolve();
    });

    expect(container.textContent).toBe('AB');
  });

  // @gate experimental
  it('can client render nested boundaries', async () => {
    let suspend = false;
    const promise = new Promise(() => {});
    const ref = React.createRef();

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
    const html = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = html + '<!--unrelated comment-->';

    const span = container.getElementsByTagName('span')[1];

    suspend = false;
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref.current).toBe(span);
    expect(span.parentNode).not.toBe(null);

    // It leaves non-React comments alone.
    expect(container.lastChild.nodeType).toBe(8);
    expect(container.lastChild.data).toBe('unrelated comment');
  });

  // @gate experimental
  it('can hydrate TWO suspense boundaries', async () => {
    const ref1 = React.createRef();
    const ref2 = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const span1 = container.getElementsByTagName('span')[0];
    const span2 = container.getElementsByTagName('span')[1];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    expect(ref1.current).toBe(span1);
    expect(ref2.current).toBe(span2);
  });

  // @gate experimental
  it('regenerates if it cannot hydrate before changes to props/context expire', async () => {
    let suspend = false;
    const promise = new Promise(resolvePromise => {});
    const ref = React.createRef();
    const ClassName = React.createContext(null);

    function Child({text}) {
      const className = React.useContext(ClassName);
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
    const finalHTML = ReactDOMServer.renderToString(
      <ClassName.Provider value={'hello'}>
        <App text="Hello" />
      </ClassName.Provider>,
    );
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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
    const newSpan = container.getElementsByTagName('span')[0];
    expect(newSpan).not.toBe(span);

    // We should now have fully rendered with a ref on the new span.
    expect(ref.current).toBe(newSpan);
    expect(newSpan.textContent).toBe('Hi');
    // If we ended up hydrating the existing content, we won't have properly
    // patched up the tree, which might mean we haven't patched the className.
    expect(newSpan.className).toBe('hi');
  });

  // @gate experimental
  it('does not invoke an event on a hydrated node until it commits', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

    function Sibling({text}) {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    let clicks = 0;

    function Button() {
      const [clicked, setClicked] = React.useState(false);
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
    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    const a = container.getElementsByTagName('a')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

  // @gate experimental
  it('does not invoke an event on a hydrated EventResponder until it commits', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

    function Sibling({text}) {
      if (suspend) {
        throw promise;
      } else {
        return 'Hello';
      }
    }

    const onEvent = jest.fn();
    const TestResponder = React.DEPRECATED_createResponder(
      'TestEventResponder',
      {
        targetEventTypes: ['click'],
        onEvent,
      },
    );

    function Button() {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});
      return <a DEPRECATED_flareListeners={listener}>Click me</a>;
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
    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    const a = container.getElementsByTagName('a')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

  // @gate experimental
  it('invokes discrete events on nested suspense boundaries in a root (legacy system)', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

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
    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    const a = container.getElementsByTagName('a')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

  // @gate experimental
  it('invokes discrete events on nested suspense boundaries in a root (responder system)', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

    const onEvent = jest.fn();
    const TestResponder = React.DEPRECATED_createResponder(
      'TestEventResponder',
      {
        targetEventTypes: ['click'],
        onEvent,
      },
    );

    function Button() {
      const listener = React.DEPRECATED_useResponder(TestResponder, {});
      return <a DEPRECATED_flareListeners={listener}>Click me</a>;
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
    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    const a = container.getElementsByTagName('a')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

  // @gate experimental
  it('does not invoke the parent of dehydrated boundary event', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

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
    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    const span = container.getElementsByTagName('span')[0];

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

  // @gate experimental
  it('does not invoke an event on a parent tree when a subtree is dehydrated', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));

    let clicks = 0;
    const childSlotRef = React.createRef();

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
    const finalHTML = ReactDOMServer.renderToString(<App />);

    const parentContainer = document.createElement('div');
    const childContainer = document.createElement('div');

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(parentContainer);

    // We're going to use a different root as a parent.
    // This lets us detect whether an event goes through React's event system.
    const parentRoot = ReactDOM.createRoot(parentContainer);
    parentRoot.render(<Parent />);
    Scheduler.unstable_flushAll();

    childSlotRef.current.appendChild(childContainer);

    childContainer.innerHTML = finalHTML;

    const a = childContainer.getElementsByTagName('a')[0];

    suspend = true;

    // Hydrate asynchronously.
    const root = ReactDOM.createRoot(childContainer, {hydrate: true});
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

  // @gate experimental
  it('blocks only on the last continuous event (legacy system)', async () => {
    let suspend1 = false;
    let resolve1;
    const promise1 = new Promise(resolvePromise => (resolve1 = resolvePromise));
    let suspend2 = false;
    let resolve2;
    const promise2 = new Promise(resolvePromise => (resolve2 = resolvePromise));

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

    const ops = [];

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

    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    const appDiv = container.getElementsByTagName('div')[0];
    const firstSpan = appDiv.getElementsByTagName('span')[0];
    const secondSpan = appDiv.getElementsByTagName('span')[1];
    expect(firstSpan.textContent).toBe('');
    expect(secondSpan.textContent).toBe('World');

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend1 = true;
    suspend2 = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

  // @gate experimental
  it('blocks only on the last continuous event (Responder system)', async () => {
    useHover = require('react-interactions/events/hover').useHover;

    let suspend1 = false;
    let resolve1;
    const promise1 = new Promise(resolvePromise => (resolve1 = resolvePromise));
    let suspend2 = false;
    let resolve2;
    const promise2 = new Promise(resolvePromise => (resolve2 = resolvePromise));

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

    const ops = [];

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
            <span DEPRECATED_flareListeners={listener1} />
            {/* We suspend after to test what happens when we eager
                attach the listener. */}
            <First />
          </Suspense>
          <Suspense fallback="Loading Second...">
            <span DEPRECATED_flareListeners={listener2}>
              <Second />
            </span>
          </Suspense>
        </div>
      );
    }

    const finalHTML = ReactDOMServer.renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    // We need this to be in the document since we'll dispatch events on it.
    document.body.appendChild(container);

    const appDiv = container.getElementsByTagName('div')[0];
    const firstSpan = appDiv.getElementsByTagName('span')[0];
    const secondSpan = appDiv.getElementsByTagName('span')[1];
    expect(firstSpan.textContent).toBe('');
    expect(secondSpan.textContent).toBe('World');

    // On the client we don't have all data yet but we want to start
    // hydrating anyway.
    suspend1 = true;
    suspend2 = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
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

  // @gate experimental
  it('finishes normal pri work before continuing to hydrate a retry', async () => {
    let suspend = false;
    let resolve;
    const promise = new Promise(resolvePromise => (resolve = resolvePromise));
    const ref = React.createRef();

    function Child() {
      if (suspend) {
        throw promise;
      } else {
        Scheduler.unstable_yieldValue('Child');
        return 'Hello';
      }
    }

    function Sibling() {
      Scheduler.unstable_yieldValue('Sibling');
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Commit Sibling');
      });
      return 'World';
    }

    // Avoid rerendering the tree by hoisting it.
    const tree = (
      <Suspense fallback="Loading...">
        <span ref={ref}>
          <Child />
        </span>
      </Suspense>
    );

    function App({showSibling}) {
      return (
        <div>
          {tree}
          {showSibling ? <Sibling /> : null}
        </div>
      );
    }

    suspend = false;
    const finalHTML = ReactDOMServer.renderToString(<App />);
    expect(Scheduler).toHaveYielded(['Child']);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    suspend = true;
    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App showSibling={false} />);
    expect(Scheduler).toFlushAndYield([]);

    expect(ref.current).toBe(null);
    expect(container.textContent).toBe('Hello');

    // Resolving the promise should continue hydration
    suspend = false;
    resolve();
    await promise;

    Scheduler.unstable_advanceTime(100);

    // Before we have a chance to flush it, we'll also render an update.
    root.render(<App showSibling={true} />);

    // When we flush we expect the Normal pri render to take priority
    // over hydration.
    expect(Scheduler).toFlushAndYieldThrough(['Sibling', 'Commit Sibling']);

    // We shouldn't have hydrated the child yet.
    expect(ref.current).toBe(null);
    // But we did have a chance to update the content.
    expect(container.textContent).toBe('HelloWorld');

    expect(Scheduler).toFlushAndYield(['Child']);

    // Now we're hydrated.
    expect(ref.current).not.toBe(null);
  });

  // @gate experimental
  // @gate new
  it('renders a hidden LegacyHidden component', async () => {
    const LegacyHidden = React.unstable_LegacyHidden;

    const ref = React.createRef();

    function App() {
      return (
        <LegacyHidden mode="hidden">
          <span ref={ref}>Hidden child</span>
        </LegacyHidden>
      );
    }

    const finalHTML = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[0];
    expect(span).toBe(undefined);

    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    expect(ref.current.innerHTML).toBe('Hidden child');
  });

  // @gate experimental
  // @gate new
  it('renders a hidden LegacyHidden component inside a Suspense boundary', async () => {
    const LegacyHidden = React.unstable_LegacyHidden;

    const ref = React.createRef();

    function App() {
      return (
        <Suspense fallback="Loading...">
          <LegacyHidden mode="hidden">
            <span ref={ref}>Hidden child</span>
          </LegacyHidden>
        </Suspense>
      );
    }

    const finalHTML = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[0];
    expect(span).toBe(undefined);

    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    expect(ref.current.innerHTML).toBe('Hidden child');
  });

  // @gate experimental
  // @gate new
  it('renders a visible LegacyHidden component', async () => {
    const LegacyHidden = React.unstable_LegacyHidden;

    const ref = React.createRef();

    function App() {
      return (
        <LegacyHidden mode="visible">
          <span ref={ref}>Hidden child</span>
        </LegacyHidden>
      );
    }

    const finalHTML = ReactDOMServer.renderToString(<App />);

    const container = document.createElement('div');
    container.innerHTML = finalHTML;

    const span = container.getElementsByTagName('span')[0];

    const root = ReactDOM.createRoot(container, {hydrate: true});
    root.render(<App />);
    Scheduler.unstable_flushAll();
    expect(ref.current).toBe(span);
    expect(ref.current.innerHTML).toBe('Hidden child');
  });
});
