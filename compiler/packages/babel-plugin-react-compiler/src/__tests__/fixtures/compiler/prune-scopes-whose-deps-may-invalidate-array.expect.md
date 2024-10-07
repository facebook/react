
## Input

```javascript
import {useHook, identity} from 'shared-runtime';

function Component(props) {
  let x = 42;
  if (props.cond) {
    x = [];
  }
  useHook(); // intersperse a hook call to prevent memoization of x
  identity(x);

  const y = [x];

  return [y];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'sathya'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useHook, identity } from "shared-runtime";

function Component(props) {
  const $ = _c(4);
  let x = 42;
  if (props.cond) {
    x = [];
  }

  useHook();
  identity(x);
  let t0;
  if ($[0] !== x) {
    t0 = [x];
    $[0] = x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  let t1;
  if ($[2] !== y) {
    t1 = [y];
    $[2] = y;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "sathya" }],
};

```
      
### Eval output
(kind: ok) [[42]]