/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type HookEffectTag = number;

export const NoEffect = /*                   */ 0b000000000;
export const UnmountSnapshot = /*            */ 0b000000010;
export const UnmountMutation = /*            */ 0b000000100;
export const MountMutation = /*              */ 0b000001000;
export const UnmountLayout = /*              */ 0b000010000;
export const MountLayout = /*                */ 0b000100000;
export const MountPassive = /*               */ 0b001000000;
export const UnmountPassive = /*             */ 0b010000000;
export const NoEffectPassiveUnmountFiber = /**/ 0b100000000;
