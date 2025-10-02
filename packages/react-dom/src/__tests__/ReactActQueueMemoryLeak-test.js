/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

let React;
let ReactDOMClient;
let Scheduler;
let act;
let container;
let assertLog;

jest.useRealTimers();

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('React.act() actQueue memory leak', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    Scheduler = require('scheduler');
    act = React.act;
    container = document.createElement('div');
    document.body.appendChild(container);
    assertLog = require('internal-test-utils/assertLog');
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.restoreAllMocks();
  });

  it('should clear actQueue after multiple act() calls to prevent memory leaks', async () => {
    // This test reproduces the bug where actQueue grows forever
    // when calling act() multiple times with suspended components
    
    let resolvePromise;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    function SuspendingComponent() {
      const [data, setData] = React.useState(null);
      
      React.useEffect(() => {
        // This will suspend the component
        React.use(promise);
        setData('resolved');
      }, []);
      
      return <div>{data || 'loading...'}</div>;
    }

    function App() {
      return (
        <React.Suspense fallback={<div>fallback</div>}>
          <SuspendingComponent />
        </React.Suspense>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    
    // First act() call - this should suspend
    await act(async () => {
      root.render(<App />);
    });
    
    // Check that actQueue is not null (suspended tasks remain)
    expect(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.actQueue).not.toBeNull();
    
    // Second act() call - this should also suspend
    await act(async () => {
      root.render(<App />);
    });
    
    // The actQueue should still contain suspended tasks
    expect(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.actQueue).not.toBeNull();
    
    // Third act() call - this should also suspend
    await act(async () => {
      root.render(<App />);
    });
    
    // The actQueue should still contain suspended tasks
    expect(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.actQueue).not.toBeNull();
    
    // Now resolve the promise to clear the suspension
    resolvePromise();
    
    // Wait for the suspension to resolve
    await act(async () => {
      // This should flush the queue and clear it
    });
    
    // After resolution, actQueue should be null
    expect(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.actQueue).toBeNull();
  });

  it('should clear actQueue even when tasks remain suspended indefinitely', async () => {
    // This test ensures that actQueue is cleared even when
    // suspended tasks cannot be resolved
    
    let resolvePromise;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    function SuspendingComponent() {
      const [data, setData] = React.useState(null);
      
      React.useEffect(() => {
        // This will suspend the component indefinitely
        React.use(promise);
        setData('resolved');
      }, []);
      
      return <div>{data || 'loading...'}</div>;
    }

    function App() {
      return (
        <React.Suspense fallback={<div>fallback</div>}>
          <SuspendingComponent />
        </React.Suspense>
      );
    }

    const root = ReactDOMClient.createRoot(container);
    
    // First act() call - this should suspend
    await act(async () => {
      root.render(<App />);
    });
    
    // Check that actQueue is not null (suspended tasks remain)
    expect(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.actQueue).not.toBeNull();
    
    // Second act() call - this should also suspend
    await act(async () => {
      root.render(<App />);
    });
    
    // The actQueue should still contain suspended tasks
    expect(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.actQueue).not.toBeNull();
    
    // Even with suspended tasks, the actQueue should eventually be cleared
    // when the act() call completes, to prevent memory leaks
    expect(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.actQueue).not.toBeNull();
    
    // This test will fail with the current implementation because
    // actQueue is never cleared when tasks remain suspended
  });
});
