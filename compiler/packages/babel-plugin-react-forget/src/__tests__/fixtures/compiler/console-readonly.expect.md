
## Input

```javascript
import { shallowCopy } from "shared-runtime";

function Component(props) {
  const x = shallowCopy(props);
  // These calls should view x as readonly and be grouped outside of the reactive scope for x:
  console.log(x);
  console.info(x);
  console.warn(x);
  console.error(x);
  console.trace(x);
  console.table(x);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2 }],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { shallowCopy } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== props) {
    t0 = shallowCopy(props);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;

  console.log(x);
  console.info(x);
  console.warn(x);
  console.error(x);
  console.trace(x);
  console.table(x);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 2 }],
  isComponent: false,
};

```
      