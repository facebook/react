/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

let Reconciler;
let assertConsoleErrorDev;

describe('ReactReconciler flushSync deprecation', () => {
  beforeEach(() => {
    jest.resetModules();
    Reconciler = require('react-reconciler');
    const InternalTestUtils = require('internal-test-utils');
    assertConsoleErrorDev = InternalTestUtils.assertConsoleErrorDev;
  });

  // @gate __DEV__
  it('warns when accessing the deprecated flushSync export', () => {
    const flushSync = Reconciler.flushSync;
    expect(typeof flushSync).toBe('function');
    flushSync();
    assertConsoleErrorDev([
      'The `flushSync` export from react-reconciler has been removed. ' +
        'Use `updateContainerSync()` followed by `flushSyncWork()` instead. ' +
        'See https://github.com/facebook/react/pull/28500 for more details.',
    ]);
  });
});
