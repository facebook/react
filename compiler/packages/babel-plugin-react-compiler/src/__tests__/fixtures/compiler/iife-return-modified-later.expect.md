
## Input

```javascript
function Component(props) {
  const items = (() => {
    return [];
  })();
  items.push(props.a);
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: {} }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(3);
  let t0;
  let t1;
  if ($[0] !== props.a) {
    t0 = [];
    const items = t0;

    t1 = items;
    items.push(props.a);
    $[0] = props.a;
    $[1] = t1;
    $[2] = t0;
  } else {
    t1 = $[1];
    t0 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: {} }],
};

```
      
### Eval output
(kind: ok) [{}]