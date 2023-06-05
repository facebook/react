
## Input

```javascript
function Component(props) {
  const items = bar();
  mutate(items.a, props.a);

  const count = foo(items.length + 1);

  return { items, count };
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(7);
  const c_0 = $[0] !== props.a;
  let items;
  if (c_0) {
    items = bar();
    mutate(items.a, props.a);
    $[0] = props.a;
    $[1] = items;
  } else {
    items = $[1];
  }

  const t0 = items.length + 1;
  const c_2 = $[2] !== t0;
  let t1;
  if (c_2) {
    t1 = foo(t0);
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const count = t1;
  const c_4 = $[4] !== items;
  const c_5 = $[5] !== count;
  let t2;
  if (c_4 || c_5) {
    t2 = { items, count };
    $[4] = items;
    $[5] = count;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      