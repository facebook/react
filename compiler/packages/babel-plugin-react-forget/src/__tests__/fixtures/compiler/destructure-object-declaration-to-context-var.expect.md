
## Input

```javascript
import { identity } from "shared-runtime";

function Component(props) {
  let { x } = props;
  const foo = () => {
    x = identity(props.x);
  };
  foo();
  return { x };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { identity } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(5);
  const { x: t0 } = props;
  let x;
  if ($[0] !== t0 || $[1] !== props.x) {
    x = t0;
    const foo = () => {
      x = identity(props.x);
    };

    foo();
    $[0] = t0;
    $[1] = props.x;
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
  params: [{ x: 42 }],
};

```
      
### Eval output
(kind: ok) {"x":42}