
## Input

```javascript
// @enableMergeConsecutiveScopes
function Component(props) {
  // start of scope for y, depend on props.a
  let y = {};

  // nested scope for x, dependent on props.a
  const x = {};
  mutate(x, props.a);
  // end of scope for x

  y.a = props.a;
  y.x = x;
  // end of scope for y

  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableMergeConsecutiveScopes
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.a;
  let y;
  if (c_0) {
    y = {};

    const x = {};
    mutate(x, props.a);

    y.a = props.a;
    y.x = x;
    $[0] = props.a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 42 }],
};

```
      