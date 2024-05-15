/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {createContext, useContext} from 'react';

const A = createContext(1);
const B = createContext(2);

export function Component() {
  const a = useContext(A);
  const b = useContext(B);

  // prettier-ignore
  const c = useContext(A), d = useContext(B); // eslint-disable-line one-var

  return a + b + c + d;
}
