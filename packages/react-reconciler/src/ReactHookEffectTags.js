/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type HookEffectTag = number;

export const NoEffect = /*  */ 0b000;

// Represents whether effect should fire.
export const HasEffect = /* */ 0b001;

// Represents the phase in which the effect (not the clean-up) fires.
export const Layout = /*    */ 0b010;
export const Passive = /*   */ 0b100;
