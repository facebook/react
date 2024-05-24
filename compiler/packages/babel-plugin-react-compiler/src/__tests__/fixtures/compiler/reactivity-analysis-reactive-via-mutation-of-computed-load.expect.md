
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
  const $ = _c(3);
  let t0;
  if ($[0] !== props.key || $[1] !== props.a) {
    const items = bar();

    const count = foo(items.length + 1);

    t0 = { items, count };
    mutate(items[props.key], props.a);
    $[0] = props.key;
    $[1] = props.a;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      