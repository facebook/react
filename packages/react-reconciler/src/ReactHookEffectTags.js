/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type HookFlags = number;

export const NoFlags = /*   */ 0b0000;

// Represents whether effect should fire.
export const HasEffect = /* */ 0b0001;

// Represents the phase in which the effect (not the clean-up) fires.
export const Insertion = /* */ 0b0010;
export const Layout = /*    */ 0b0100;
export const Passive = /*   */ 0b1000;

export const listFlags = (inputFlag: HookFlags): string[] => {
  if (__DEV__) {
    const list = [];
    const flags = [
      [NoFlags, 'NoFlags'],
      [HasEffect, 'HasEffect'],
      [Insertion, 'Insertion'],
      [Layout, 'Layout'],
      [Passive, 'Passive'],
    ];
    flags.forEach(flag => {
      if (flag[0] & inputFlag) {
        list.push(flag[1]);
      }
    });
    return list;
  } else {
    return [];
  }
};

export function prettyFlags(flags: HookFlags): string {
  if (__DEV__) {
    return listFlags(flags).join('\n');
  } else {
    return '';
  }
}
