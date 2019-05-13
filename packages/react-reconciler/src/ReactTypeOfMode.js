/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type TypeOfMode = number;

export const NoMode = 0b0000;
export const StrictMode = 0b0001;
// TODO: Remove BatchedMode and ConcurrentMode by reading from the root
// tag instead
export const BatchedMode = 0b0010;
export const ConcurrentMode = 0b0100;
export const ProfileMode = 0b1000;
