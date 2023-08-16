
## Input

```javascript
function Component(props) {
  const x = { ...props.foo };
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.foo;
  let t0;
  if (c_0) {
    t0 = { ...props.foo };
    $[0] = props.foo;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      