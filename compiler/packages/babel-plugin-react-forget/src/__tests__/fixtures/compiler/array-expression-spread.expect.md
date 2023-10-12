
## Input

```javascript
function Component(props) {
  const x = [0, ...props.foo, null, ...props.bar, "z"];
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ foo: [1, 2, 3], bar: [4, 5, 6] }],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let t0;
  if ($[0] !== props.foo || $[1] !== props.bar) {
    t0 = [0, ...props.foo, null, ...props.bar, "z"];
    $[0] = props.foo;
    $[1] = props.bar;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const x = t0;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ foo: [1, 2, 3], bar: [4, 5, 6] }],
  isComponent: false,
};

```
      