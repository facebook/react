/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This file is used as temporary storage for modules generated in Flight tests.
let moduleIdx = 0;
const modules: Map<string, Function> = new Map();

// This simulates what the compiler will do when it replaces render functions with server blocks.
export function saveModule(render: Function): string {
  const idx = '' + moduleIdx++;
  modules.set(idx, render);
  return idx;
}

export function readModule(idx: string): Function {
  return modules.get(idx);
}
