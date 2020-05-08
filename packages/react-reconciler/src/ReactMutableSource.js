/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableNewReconciler} from 'shared/ReactFeatureFlags';

// The entry file imports either the old or new version of mutable source.
// This is necessary since ReactDOMRoot imports this module directly.
// Note that it's not possible to export all of the API methods,
// as the new and old implementations fork slightly (due to the lanes refactor).
// It's only necessary to export the subset of the API required by ReactDOMRoot.

import {registerMutableSourceForHydration as registerMutableSourceForHydration_old} from './ReactMutableSource.old';

import {registerMutableSourceForHydration as registerMutableSourceForHydration_new} from './ReactMutableSource.new';

export const registerMutableSourceForHydration = enableNewReconciler
  ? registerMutableSourceForHydration_new
  : registerMutableSourceForHydration_old;
