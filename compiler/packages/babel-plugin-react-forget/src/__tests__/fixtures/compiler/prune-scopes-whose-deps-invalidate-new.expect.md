
## Input

```javascript
import { useHook } from "shared-runtime";

function Component(props) {
  const x = new Foo();
  useHook(); // intersperse a hook call to prevent memoization of x
  x.value = props.value;

  const y = { x };

  return { y };
}

class Foo {}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "sathya" }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { useHook } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(4);
  const x = new Foo();
  useHook();
  x.value = props.value;
  let t0;
  if ($[0] !== x) {
    t0 = { x };
    $[0] = x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  let t1;
  if ($[2] !== y) {
    t1 = { y };
    $[2] = y;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

class Foo {}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "sathya" }],
};

```
      
### Eval output
(kind: ok) {"y":{"x":{"value":"sathya"}}}