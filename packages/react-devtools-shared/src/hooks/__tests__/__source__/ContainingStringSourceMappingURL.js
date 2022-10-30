/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {useState} from 'react';

// ?sourceMappingURL=([^\s'"]+)/gm

const abc = 'abc';
const string =
  'sourceMappingURL=data:application/json;charset=utf-8;base64,' + abc;

export function Component() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <div>string: {string}</div>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
