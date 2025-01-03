
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
  params: [{a: {}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(3);
  let t0;
  let items;
  if ($[0] !== props.a) {
    t0 = [];
    items = t0;

    items.push(props.a);
    $[0] = props.a;
    $[1] = items;
    $[2] = t0;
  } else {
    items = $[1];
    t0 = $[2];
  }
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: {} }],
};

```
      
### Eval output
(kind: ok) [{}]