// @flow

export function act(callback: Function): void {
  const TestUtils = require('react-dom/test-utils');
  TestUtils.act(() => {
    callback();
  });

  // Flush Bridge operations
  jest.runAllTimers();
}

export async function actSuspense(callback: Function) {
  const TestUtils = require('react-dom/test-utils');
  const Scheduler = require('scheduler');

  // $FlowFixMe Flow doens't know about "await act()" yet
  await TestUtils.act(async () => {
    callback();

    // Resolve pending suspense promises
    jest.runAllTimers();
  });

  // Re-render after resolved promises
  Scheduler.flushAll();
}

export function beforeEachProfiling() {
  // Mock React's timing information so that test runs are predictable.
  jest.mock('scheduler', () =>
    // $FlowFixMe Flow does not konw about requireActual
    require.requireActual('scheduler/unstable_mock')
  );

  // DevTools itself uses performance.now() to offset commit times
  // so they appear relative to when profiling was started in the UI.
  jest.spyOn(performance, 'now').mockImplementation(
    // $FlowFixMe Flow does not konw about requireActual
    require.requireActual('scheduler/unstable_mock').unstable_now
  );
}

export function getRendererID() {
  if (global.agent == null) {
    throw Error('Agent unavailable.');
  }
  const ids = Object.keys(global.agent._rendererInterfaces);
  if (ids.length !== 1) {
    throw Error('Multiple renderers attached.');
  }
  return ids[0];
}

export function requireTestRenderer() {
  let hook;
  try {
    // Hide the hook before requiring TestRenderer, so we don't end up with a loop.
    hook = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;

    return require('react-test-renderer');
  } finally {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
  }
}
