// @flow

import typeof ReactTestRenderer from 'react-test-renderer';

import type Bridge from 'src/bridge';
import type Store from 'src/devtools/store';
import type { ProfilingDataFrontend } from 'src/devtools/views/Profiler/types';
import type { ElementType } from 'src/types';

export function act(callback: Function): void {
  const TestUtils = require('react-dom/test-utils');
  TestUtils.act(() => {
    callback();
  });

  // Flush Bridge operations
  TestUtils.act(() => {
    jest.runAllTimers();
  });
}

export async function actAsync(
  cb: () => *,
  recursivelyFlush: boolean = true
): Promise<void> {
  const TestUtils = require('react-dom/test-utils');

  // $FlowFixMe Flow doens't know about "await act()" yet
  await TestUtils.act(async () => {
    await cb();
  });

  if (recursivelyFlush) {
    while (jest.getTimerCount() > 0) {
      // $FlowFixMe Flow doens't know about "await act()" yet
      await TestUtils.act(async () => {
        jest.runAllTimers();
      });
    }
  } else {
    // $FlowFixMe Flow doesn't know about "await act()" yet
    await TestUtils.act(async () => {
      jest.runOnlyPendingTimers();
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

export function exportImportHelper(bridge: Bridge, store: Store): void {
  const { act } = require('./utils');
  const {
    prepareProfilingDataExport,
    prepareProfilingDataFrontendFromExport,
  } = require('src/devtools/views/Profiler/utils');

  const { profilerStore } = store;

  expect(profilerStore.profilingData).not.toBeNull();

  const profilingDataFrontendInitial = ((profilerStore.profilingData: any): ProfilingDataFrontend);

  const profilingDataExport = prepareProfilingDataExport(
    profilingDataFrontendInitial
  );

  // Simulate writing/reading to disk.
  const serializedProfilingDataExport = JSON.stringify(
    profilingDataExport,
    null,
    2
  );
  const parsedProfilingDataExport = JSON.parse(serializedProfilingDataExport);

  const profilingDataFrontend = prepareProfilingDataFrontendFromExport(
    (parsedProfilingDataExport: any)
  );

  // Sanity check that profiling snapshots are serialized correctly.
  expect(profilingDataFrontendInitial).toEqual(profilingDataFrontend);

  // Snapshot the JSON-parsed object, rather than the raw string, because Jest formats the diff nicer.
  expect(parsedProfilingDataExport).toMatchSnapshot('imported data');

  act(() => {
    // Apply the new exported-then-reimported data so tests can re-run assertions.
    profilerStore.profilingData = profilingDataFrontend;
  });
}
