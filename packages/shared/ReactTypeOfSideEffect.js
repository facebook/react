/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

export type TypeOfSideEffect = number;

// Don't change these two values:
export const NoEffect = 0; //           0b00000000
export const PerformedWork = 1; //      0b00000001

// You can change the rest (and add more).
export const Placement = 2; //          0b00000010
export const Update = 4; //             0b00000100
export const PlacementAndUpdate = 6; // 0b00000110
export const Deletion = 8; //           0b00001000
export const ContentReset = 16; //      0b00010000
export const Callback = 32; //          0b00100000
export const Err = 64; //               0b01000000
export const Ref = 128; //              0b10000000
