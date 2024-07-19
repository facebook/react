
## Input

```javascript
function Component(props) {
  const items = bar();
  mutate(items[props.key], props.a);

  const count = foo(items.length + 1);

  return {items, count};
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(8);
  let items;
  if ($[0] !== props.key || $[1] !== props.a) {
    items = bar();
    mutate(items[props.key], props.a);
    $[0] = props.key;
    $[1] = props.a;
    $[2] = items;
  } else {
    items = $[2];
  }

  const t0 = items.length + 1;
  let t1;
  if ($[3] !== t0) {
    t1 = foo(t0);
    $[3] = t0;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const count = t1;
  let t2;
  if ($[5] !== items || $[6] !== count) {
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
      