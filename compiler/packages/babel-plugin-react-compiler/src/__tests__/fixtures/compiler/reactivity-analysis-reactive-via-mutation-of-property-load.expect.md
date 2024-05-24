
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(8);
  let items;
  let t0;
  if ($[0] !== props.a) {
    items = bar();

    t0 = items;
    mutate(items.a, props.a);
    $[0] = props.a;
    $[1] = items;
    $[2] = t0;
  } else {
    items = $[1];
    t0 = $[2];
  }
  const t1 = items.length + 1;
  let t2;
  if ($[3] !== t1) {
    t2 = foo(t1);
    $[3] = t1;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const count = t2;
  let t3;
  if ($[5] !== t0 || $[6] !== count) {
    t3 = { items: t0, count };
    $[5] = t0;
    $[6] = count;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  return t3;
}

```
      