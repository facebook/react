
## Input

```javascript
import { identity } from "shared-runtime";

function Component(props) {
  let [x] = props.value;
  const foo = () => {
    x = identity(props.value[0]);
  };
  foo();
  return { x };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: [42] }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { identity } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(5);
  const [t0] = props.value;
  let x;
  if ($[0] !== t0 || $[1] !== props.value) {
    x = t0;
    const foo = () => {
      x = identity(props.value[0]);
    };

    foo();
    $[0] = t0;
    $[1] = props.value;
    $[2] = x;
  } else {
    x = $[2];
  }
  const t1 = x;
  let t2;
  if ($[3] !== t1) {
    t2 = { x: t1 };
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: [42] }],
};

```
      
### Eval output
(kind: ok) {"x":42}