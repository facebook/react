
## Input

```javascript
function Component(props) {
  const items = bar();
  mutate(items[props.key], props.a);

  const count = foo(items.length + 1);

  return { items, count };
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(8);
  const c_0 = $[0] !== props.key;
  const c_1 = $[1] !== props.a;
  let items;
  if (c_0 || c_1) {
    items = bar();
    mutate(items[props.key], props.a);
    $[0] = props.key;
    $[1] = props.a;
    $[2] = items;
  } else {
    items = $[2];
  }

  const t0 = items.length + 1;
  const c_3 = $[3] !== t0;
  let t1;
  if (c_3) {
    t1 = foo(t0);
    $[3] = t0;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const count = t1;
  const c_5 = $[5] !== items;
  const c_6 = $[6] !== count;
  let t2;
  if (c_5 || c_6) {
    t2 = { items, count };
    $[5] = items;
    $[6] = count;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
}

```
      