/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


import type { Store } from "./stores";

const index = `\
function fibbonacci(n) {
  let a = 0;
  let b = 1;
  let c = 1;
  for (let i = 0; i < n; i++) {
    a = b;
    b = c;
    c = a + b;
  }
  return a;
}
`;

export const defaultStore: Store = {
  source: index,
};

const minimalIndex = `\
export default function MyApp() {
  return <div>Hello World</div>;
}
`;

export const minimalStore: Store = {
  source: minimalIndex,
};

export const emptyStore: Store = {
  source: "",
};
