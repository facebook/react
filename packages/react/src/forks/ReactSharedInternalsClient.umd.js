/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as Scheduler from 'scheduler';
import ReactCurrentDispatcher from '../ReactCurrentDispatcher';
import ReactCurrentCache from '../ReactCurrentCache';
import ReactCurrentActQueue from '../ReactCurrentActQueue';
import ReactCurrentOwner from '../ReactCurrentOwner';
import ReactDebugCurrentFrame from '../ReactDebugCurrentFrame';
import ReactCurrentBatchConfig from '../ReactCurrentBatchConfig';

const ReactSharedInternalsClient = {
  ReactCurrentDispatcher,
  ReactCurrentCache,
  ReactCurrentOwner,
  ReactCurrentBatchConfig,

  // Re-export the schedule API(s) for UMD bundles.
  // This avoids introducing a dependency on a new UMD global in a minor update,
  // Since that would be a breaking change (e.g. for all existing CodeSandboxes).
  // This re-export is only required for UMD bundles;
  // CJS bundles use the shared NPM package.
  Scheduler,
};

if (__DEV__) {
  ReactSharedInternalsClient.ReactCurrentActQueue = ReactCurrentActQueue;
  ReactSharedInternalsClient.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
}

export default ReactSharedInternalsClient;
