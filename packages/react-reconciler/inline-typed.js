/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This file must have the Flow annotation.
//
// This is the Flow-typed entry point for the reconciler. It should not be
// imported directly in code. Instead, our Flow configuration uses this entry
// point for the currently checked renderer (the one you passed to `yarn flow`).
//
// For example, if you run `yarn flow dom`, `react-reconciler/inline.dom` points
// to this module (and thus will be considered Flow-typed). But other renderers
// (e.g. `react-test-renderer`) will see reconciler as untyped during the check.
//
// We can't make all entry points typed at the same time because different
// renderers have different host config types. So we check them one by one.
// We run Flow on all renderers on CI.

export * from './src/ReactFiberReconciler';
