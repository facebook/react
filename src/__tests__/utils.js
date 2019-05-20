// @flow

import typeof ReactTestRenderer from 'react-test-renderer';

import type { ElementType } from 'src/types';

import type Bridge from 'src/bridge';
import type Store from 'src/devtools/store';

export function act(callback: Function): void {
  const TestUtils = require('react-dom/test-utils');
  TestUtils.act(() => {
    callback();
  });

  // Flush Bridge operations
  jest.runAllTimers();
}

export async function actAsync(
  callback: Function,
  numTimesToFlush: number = 1
): Promise<void> {
  const TestUtils = require('react-dom/test-utils');
  const Scheduler = require('scheduler');

  // $FlowFixMe Flow doens't know about "await act()" yet
  await TestUtils.act(async () => {
    callback();

    // Resolve pending suspense promises
    jest.runOnlyPendingTimers();
  });

  // Run cascading microtasks and flush scheduled React work.
  // Components that suspend multiple times will need to do this once per suspend operation.
  // HACK Ideally the mock scheduler would provide an API to ask if there was outstanding work.
  while (--numTimesToFlush >= 0) {
    // $FlowFixMe Flow doens't know about "await act()" yet
    await TestUtils.act(async () => {
      jest.runOnlyPendingTimers();
      Scheduler.flushAll();
    });
  }
}

export function beforeEachProfiling(): void {
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

export function createElementTypeFilter(
  elementType: ElementType,
  isEnabled: boolean = true
) {
  const Types = require('src/types');
  return {
    type: Types.ComponentFilterElementType,
    isEnabled,
    value: elementType,
  };
}

export function createDisplayNameFilter(
  source: string,
  isEnabled: boolean = true
) {
  const Types = require('src/types');
  let isValid = true;
  try {
    new RegExp(source);
  } catch (error) {
    isValid = false;
  }
  return {
    type: Types.ComponentFilterDisplayName,
    isEnabled,
    isValid,
    value: source,
  };
}

export function createLocationFilter(
  source: string,
  isEnabled: boolean = true
) {
  const Types = require('src/types');
  let isValid = true;
  try {
    new RegExp(source);
  } catch (error) {
    isValid = false;
  }
  return {
    type: Types.ComponentFilterLocation,
    isEnabled,
    isValid,
    value: source,
  };
}

export function getRendererID(): number {
  if (global.agent == null) {
    throw Error('Agent unavailable.');
  }
  const ids = Object.keys(global.agent._rendererInterfaces);
  if (ids.length !== 1) {
    throw Error('Multiple renderers attached.');
  }
  return parseInt(ids[0], 10);
}

export function requireTestRenderer(): ReactTestRenderer {
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

export function exportImportHelper(
  bridge: Bridge,
  store: Store,
  rendererID: number,
  rootID: number
): void {
  const { act } = require('./utils');
  const {
    prepareExportedProfilingSummary,
    prepareImportedProfilingData,
  } = require('src/devtools/views/Profiler/utils');

  let exportedProfilingDataJsonString = '';
  const onExportFile = ({ contents }) => {
    if (typeof contents === 'string') {
      exportedProfilingDataJsonString = (contents: string);
    }
  };
  bridge.addListener('exportFile', onExportFile);

  act(() => {
    const exportProfilingSummary = prepareExportedProfilingSummary(
      store.profilingOperations,
      store.profilingSnapshots,
      rendererID,
      rootID
    );
    bridge.send('exportProfilingSummary', exportProfilingSummary);
  });

  // Cleanup to be able to call this again on the same bridge without memory leaks.
  bridge.removeListener('exportFile', onExportFile);

  expect(typeof exportedProfilingDataJsonString).toBe('string');
  expect(exportedProfilingDataJsonString).not.toBe('');

  const profilingData = prepareImportedProfilingData(
    exportedProfilingDataJsonString
  );
  // Sanity check that profiling snapshots are serialized correctly.
  expect(store.profilingSnapshots.get(rootID)).toEqual(
    profilingData.profilingSnapshots.get(rootID)
  );
  expect(store.profilingOperations.get(rootID)).toEqual(
    profilingData.profilingOperations.get(rootID)
  );

  // Snapshot the JSON-parsed object, rather than the raw string, because Jest formats the diff nicer.
  expect(profilingData).toMatchSnapshot('imported data');

  act(() => {
    store.profilingData = profilingData;
  });
}
