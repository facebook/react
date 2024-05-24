
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(9);
  let items;
  let t0;
  if ($[0] !== props.key || $[1] !== props.a) {
    items = bar();

    t0 = items;
    mutate(items[props.key], props.a);
    $[0] = props.key;
    $[1] = props.a;
    $[2] = items;
    $[3] = t0;
  } else {
    items = $[2];
    t0 = $[3];
  }
  const t1 = items.length + 1;
  let t2;
  if ($[4] !== t1) {
    t2 = foo(t1);
    $[4] = t1;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const count = t2;
  let t3;
  if ($[6] !== t0 || $[7] !== count) {
    t3 = { items: t0, count };
    $[6] = t0;
    $[7] = count;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  return t3;
}

```
      