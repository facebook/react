/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type TypeOfInternalContext = number;

export const NoContext = 0b00000000;
export const AsyncUpdates = 0b00000001;
export const StrictMode = 0b00000010;
