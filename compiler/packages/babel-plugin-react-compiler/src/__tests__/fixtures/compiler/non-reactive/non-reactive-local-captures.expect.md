
## Input

```javascript
// @enableNonReactiveAnnotation @enableUseTypeAnnotations
import {useState} from 'react';

type NonReactive<T> = T;

function Component() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('world');

  const handler: NonReactive<() => void> = () => {
    console.log(count, name);
  };

  return (
    <div>
      <button onClick={handler}>Log</button>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setName('React')}>Set name</button>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableNonReactiveAnnotation @enableUseTypeAnnotations
import { useState } from "react";

type NonReactive<T> = T;

function Component() {
  const $ = _c(8);
  const [count, setCount] = useState(0);
  const [name, setName] = useState("world");
  let t0;
  t0 = () => {
    console.log(count, name);
  };
  $[0] = t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (...args) => $[0](...args);
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const handler = t0;
  let t1;
  if ($[2] !== handler) {
    t1 = <button onClick={handler}>Log</button>;
    $[2] = handler;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <button onClick={() => setCount(_temp)}>Increment</button>;
    t3 = <button onClick={() => setName("React")}>Set name</button>;
    $[4] = t2;
    $[5] = t3;
  } else {
    t2 = $[4];
    t3 = $[5];
  }
  let t4;
  if ($[6] !== t1) {
    t4 = (
      <div>
        {t1}
        {t2}
        {t3}
      </div>
    );
    $[6] = t1;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  return t4;
}
function _temp(c) {
  return c + 1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div><button>Log</button><button>Increment</button><button>Set name</button></div>