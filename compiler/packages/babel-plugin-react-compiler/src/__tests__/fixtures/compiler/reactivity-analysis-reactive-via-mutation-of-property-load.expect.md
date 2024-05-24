
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
  const $ = _c(2);
  let t0;
  if ($[0] !== props.a) {
    const items = bar();

    const count = foo(items.length + 1);

    t0 = { items, count };
    mutate(items.a, props.a);
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      