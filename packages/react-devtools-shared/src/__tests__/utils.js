/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import typeof ReactTestRenderer from 'react-test-renderer';

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type Store from 'react-devtools-shared/src/devtools/store';
import type {ProfilingDataFrontend} from 'react-devtools-shared/src/devtools/views/Profiler/types';
import type {ElementType} from 'react-devtools-shared/src/types';

export function act(
  callback: Function,
  recursivelyFlush: boolean = true,
): void {
  const {act: actTestRenderer} = require('react-test-renderer');
  const {act: actDOM} = require('react-dom/test-utils');

  actDOM(() => {
    actTestRenderer(() => {
      callback();
    });
  });

  if (recursivelyFlush) {
    // Flush Bridge operations
    while (jest.getTimerCount() > 0) {
      actDOM(() => {
        actTestRenderer(() => {
          jest.runAllTimers();
        });
      });
    }
  }
}

export async function actAsync(
  cb: () => *,
  recursivelyFlush: boolean = true,
): Promise<void> {
  const {act: actTestRenderer} = require('react-test-renderer');
  const {act: actDOM} = require('react-dom/test-utils');

  await actDOM(async () => {
    await actTestRenderer(async () => {
      await cb();
    });
  });

  if (recursivelyFlush) {
    while (jest.getTimerCount() > 0) {
      await actDOM(async () => {
        await actTestRenderer(async () => {
          jest.runAllTimers();
        });
      });
    }
  } else {
    await actDOM(async () => {
      await actTestRenderer(async () => {
        jest.runOnlyPendingTimers();
      });
    });
  }
}

export function beforeEachProfiling(): void {
  // Mock React's timing information so that test runs are predictable.
  jest.mock('scheduler', () => jest.requireActual('scheduler/unstable_mock'));

  // DevTools itself uses performance.now() to offset commit times
  // so they appear relative to when profiling was started in the UI.
  jest
    .spyOn(performance, 'now')
    .mockImplementation(
      jest.requireActual('scheduler/unstable_mock').unstable_now,
    );
}

export function createDisplayNameFilter(
  source: string,
  isEnabled: boolean = true,
) {
  const Types = require('react-devtools-shared/src/types');
  let isValid = true;
  try {
    new RegExp(source); // eslint-disable-line no-new
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

export function createHOCFilter(isEnabled: boolean = true) {
  const Types = require('react-devtools-shared/src/types');
  return {
    type: Types.ComponentFilterHOC,
    isEnabled,
    isValid: true,
  };
}

export function createElementTypeFilter(
  elementType: ElementType,
  isEnabled: boolean = true,
) {
  const Types = require('react-devtools-shared/src/types');
  return {
    type: Types.ComponentFilterElementType,
    isEnabled,
    value: elementType,
  };
}

export function createLocationFilter(
  source: string,
  isEnabled: boolean = true,
) {
  const Types = require('react-devtools-shared/src/types');
  let isValid = true;
  try {
    new RegExp(source); // eslint-disable-line no-new
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

  const id = ids.find(innerID => {
    const rendererInterface = global.agent._rendererInterfaces[innerID];
    return rendererInterface.renderer.rendererPackageName === 'react-dom';
  });

  if (ids == null) {
    throw Error('Could not find renderer.');
  }

  return parseInt(id, 10);
}

export function legacyRender(elements, container) {
  if (container == null) {
    container = document.createElement('div');
  }

  const ReactDOM = require('react-dom');
  withErrorsOrWarningsIgnored(
    ['ReactDOM.render is no longer supported in React 18'],
    () => {
      ReactDOM.render(elements, container);
    },
  );

  return () => {
    ReactDOM.unmountComponentAtNode(container);
  };
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

export function exportImportHelper(bridge: FrontendBridge, store: Store): void {
  const {
    prepareProfilingDataExport,
    prepareProfilingDataFrontendFromExport,
  } = require('react-devtools-shared/src/devtools/views/Profiler/utils');

  const {profilerStore} = store;

  expect(profilerStore.profilingData).not.toBeNull();

  const profilingDataFrontendInitial =
    ((profilerStore.profilingData: any): ProfilingDataFrontend);
  expect(profilingDataFrontendInitial.imported).toBe(false);

  const profilingDataExport = prepareProfilingDataExport(
    profilingDataFrontendInitial,
  );

  // Simulate writing/reading to disk.
  const serializedProfilingDataExport = JSON.stringify(
    profilingDataExport,
    null,
    2,
  );
  const parsedProfilingDataExport = JSON.parse(serializedProfilingDataExport);

  const profilingDataFrontend = prepareProfilingDataFrontendFromExport(
    (parsedProfilingDataExport: any),
  );
  expect(profilingDataFrontend.imported).toBe(true);

  // Sanity check that profiling snapshots are serialized correctly.
  expect(profilingDataFrontendInitial.dataForRoots).toEqual(
    profilingDataFrontend.dataForRoots,
  );
  expect(profilingDataFrontendInitial.timelineData).toEqual(
    profilingDataFrontend.timelineData,
  );

  // Snapshot the JSON-parsed object, rather than the raw string, because Jest formats the diff nicer.
  // expect(parsedProfilingDataExport).toMatchSnapshot('imported data');

  act(() => {
    // Apply the new exported-then-imported data so tests can re-run assertions.
    profilerStore.profilingData = profilingDataFrontend;
  });
}

/**
 * Runs `fn` while preventing console error and warnings that partially match any given `errorOrWarningMessages` from appearing in the console.
 * @param errorOrWarningMessages Messages are matched partially (i.e. indexOf), pre-formatting.
 * @param fn
 */
export function withErrorsOrWarningsIgnored<T: void | Promise<void>>(
  errorOrWarningMessages: string[],
  fn: () => T,
): T {
  // withErrorsOrWarningsIgnored() may be nested.
  const prev = global._ignoredErrorOrWarningMessages || [];

  let resetIgnoredErrorOrWarningMessages = true;
  try {
    global._ignoredErrorOrWarningMessages = [
      ...prev,
      ...errorOrWarningMessages,
    ];
    const maybeThenable = fn();
    if (
      maybeThenable !== undefined &&
      typeof maybeThenable.then === 'function'
    ) {
      resetIgnoredErrorOrWarningMessages = false;
      return maybeThenable.then(
        () => {
          global._ignoredErrorOrWarningMessages = prev;
        },
        () => {
          global._ignoredErrorOrWarningMessages = prev;
        },
      );
    }
  } finally {
    if (resetIgnoredErrorOrWarningMessages) {
      global._ignoredErrorOrWarningMessages = prev;
    }
  }
}

export function overrideFeatureFlags(overrideFlags) {
  jest.mock('react-devtools-feature-flags', () => {
    const actualFlags = jest.requireActual('react-devtools-feature-flags');
    return {
      ...actualFlags,
      ...overrideFlags,
    };
  });
}

export function normalizeCodeLocInfo(str) {
  if (typeof str !== 'string') {
    return str;
  }
  // This special case exists only for the special source location in
  // ReactElementValidator. That will go away if we remove source locations.
  str = str.replace(/Check your code at .+?:\d+/g, 'Check your code at **');
  // V8 format:
  //  at Component (/path/filename.js:123:45)
  // React format:
  //    in Component (at filename.js:123)
  return str.replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function (m, name) {
    return '\n    in ' + name + ' (at **)';
  });
}
