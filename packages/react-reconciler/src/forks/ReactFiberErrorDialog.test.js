/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CapturedError} from '../ReactCapturedValue';

export type Features = {
  errorBoundary: boolean;
}

const silenced: $Exact<Features> = {
  errorBoundary: true,
};

export function silenceFeatures(features: Features) {
  Object.assign(silenced, features);
}

export function showErrorDialog(capturedError: CapturedError): boolean {
  if (capturedError.errorBoundaryFound && silenced.errorBoundary) {
    return false;
  }

  return true;
}
