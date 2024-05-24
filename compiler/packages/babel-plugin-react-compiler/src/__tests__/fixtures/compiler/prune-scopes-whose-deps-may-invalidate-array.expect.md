
## Input

```javascript
import { useHook, identity } from "shared-runtime";

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
  params: [{ value: "sathya" }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useHook, identity } from "shared-runtime";

function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.cond) {
    let x = 42;
    if (props.cond) {
      x = [];
    }

    const y = [x];

    t0 = [y];
    identity(x);
    $[0] = props.cond;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  useHook();
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "sathya" }],
};

```
      
### Eval output
(kind: ok) [[42]]