/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type TypeOfSideEffect = number;

// Don't change these two values:
export const NoEffect = 0b00000000;
export const PerformedWork = 0b00000001;

// You can change the rest (and add more).
export const Placement = 0b00000010;
export const Update = 0b00000100;
export const PlacementAndUpdate = 0b00000110;
export const Deletion = 0b00001000;
export const ContentReset = 0b00010000;
export const Callback = 0b00100000;
export const Err = 0b01000000;
export const Ref = 0b10000000;
