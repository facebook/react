/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * This file contains a list of custom Errors that ReactDebugTools can throw in
 * special occasions.
 * The names of the errors are exported so that other packages (such as DevTools)
 * can use them to detect and handle them separately.
 */

export const ErrorsNames = {
  UNSUPPORTTED_FEATURE_ERROR: 'UnsupportedFeatureError',
};

// For now we just override the name. If we decide to move react-debug-tools to
// devtools package, we should use a real Error class instead.
export function createUnsupportedFeatureError(message: string = '') {
  const error = new Error(message);
  error.name = ErrorsNames.UNSUPPORTTED_FEATURE_ERROR;
  return error;
}
