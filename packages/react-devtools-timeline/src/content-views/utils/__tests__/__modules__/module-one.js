/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const outerErrorA = new Error();

export const moduleStartError = new Error();
export const innerError = new Error();
export const moduleStopError = new Error();

export const outerErrorB = new Error();
