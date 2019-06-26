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
let act;

describe('ReactDOMServerPartialHydration', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableSuspenseServerRenderer = true;

    React = require('react');
    ReactDOM = require('react-dom');
    act = require('react-dom/test-utils').act;
    ReactDOMServer = require('react-dom/server');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
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
      ReactDOM.hydrate(<App />, container);
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
          <React.Fragment>
            <div>Middle</div>
            Some text
          </React.Fragment>
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
      ReactDOM.hydrate(<App />, container);
    });

    expect(container.firstChild.children[1].textContent).toBe('Middle');

    // In this state, we can still delete the boundary.
    act(() => hideMiddle());

    expect(container.firstChild.children[1].textContent).toBe('After');
  });

  it('regenerates the content if props have changed before hydration completes', async () => {
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

    // Flushing both of these in the same batch won't be able to hydrate so we'll
    // probably throw away the existing subtree.
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // Pick up the new span. In an ideal implementation this might be the same span
    // but patched up. At the time of writing, this will be a new span though.
    span = container.getElementsByTagName('span')[0];

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

  it('regenerates the content if context has changed before hydration completes', async () => {
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

    // Flushing both of these in the same batch won't be able to hydrate so we'll
    // probably throw away the existing subtree.
    Scheduler.unstable_flushAll();
    jest.runAllTimers();

    // Pick up the new span. In an ideal implementation this might be the same span
    // but patched up. At the time of writing, this will be a new span though.
    span = container.getElementsByTagName('span')[0];

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
});
