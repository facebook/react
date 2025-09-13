
## Input

```javascript
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function StringConcatenationComponent({name, suffix}) {
  // Test string concatenation optimization
  const greeting = "Hello, " + name + "!";
  const message = greeting + " " + suffix;
  
  // Test template literal optimization
  const templateMessage = `Welcome ${name}, ${suffix}`;
  
  // Test mixed concatenation
  const mixedMessage = "User: " + name + ` (${suffix})`;
  
  return (
    <div>
      <h1>{greeting}</h1>
      <p>{message}</p>
      <p>{templateMessage}</p>
      <p>{mixedMessage}</p>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: StringConcatenationComponent,
  params: [{name: "World", suffix: "Welcome to React Compiler"}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; /**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function StringConcatenationComponent(t0) {
  const $ = _c(13);
  const { name, suffix } = t0;

  const greeting = "Hello, " + name + "!";
  const message = greeting + " " + suffix;

  const templateMessage = `Welcome ${name}, ${suffix}`;

  const mixedMessage = "User: " + name + ` (${suffix})`;
  let t1;
  if ($[0] !== greeting) {
    t1 = <h1>{greeting}</h1>;
    $[0] = greeting;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== message) {
    t2 = <p>{message}</p>;
    $[2] = message;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== templateMessage) {
    t3 = <p>{templateMessage}</p>;
    $[4] = templateMessage;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== mixedMessage) {
    t4 = <p>{mixedMessage}</p>;
    $[6] = mixedMessage;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== t1 || $[9] !== t2 || $[10] !== t3 || $[11] !== t4) {
    t5 = (
      <div>
        {t1}
        {t2}
        {t3}
        {t4}
      </div>
    );
    $[8] = t1;
    $[9] = t2;
    $[10] = t3;
    $[11] = t4;
    $[12] = t5;
  } else {
    t5 = $[12];
  }
  return t5;
}

export const FIXTURE_ENTRYPOINT = {
  fn: StringConcatenationComponent,
  params: [{ name: "World", suffix: "Welcome to React Compiler" }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div><h1>Hello, World!</h1><p>Hello, World! Welcome to React Compiler</p><p>Welcome World, Welcome to React Compiler</p><p>User: World (Welcome to React Compiler)</p></div>