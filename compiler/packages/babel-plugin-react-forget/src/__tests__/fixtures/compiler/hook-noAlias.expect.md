
## Input

```javascript
// @enableNoAliasOptimizations
import { useNoAlias } from "shared-runtime";

function Component(props) {
  const item = { a: props.a };
  const x = useNoAlias(
    item,
    () => {
      console.log(props);
    },
    [props.a]
  );
  return [x, item];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: { id: 42 } }],
  isComponent: true,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableNoAliasOptimizations
import { useNoAlias } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(5);
  const c_0 = $[0] !== props.a;
  let t0;
  if (c_0) {
    t0 = { a: props.a };
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const item = t0;
  const x = useNoAlias(
    item,
    () => {
      console.log(props);
    },
    [props.a]
  );
  const c_2 = $[2] !== x;
  const c_3 = $[3] !== item;
  let t1;
  if (c_2 || c_3) {
    t1 = [x, item];
    $[2] = x;
    $[3] = item;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: { id: 42 } }],
  isComponent: true,
};

```
      