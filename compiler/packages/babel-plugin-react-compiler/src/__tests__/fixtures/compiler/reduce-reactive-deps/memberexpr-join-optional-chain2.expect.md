
## Input

```javascript
function Component(props) {
  const x = [];
  x.push(props.items?.length);
  x.push(props.items?.edges?.map?.(render)?.filter?.(Boolean) ?? []);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{items: {edges: null, length: 0}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(4);
  let x;
  if ($[0] !== props.items) {
    x = [];
    x.push(props.items?.length);
    let t0;
    if ($[2] !== props) {
      t0 = props.items?.edges?.map?.(render)?.filter?.(Boolean) ?? [];
      $[2] = props;
      $[3] = t0;
    } else {
      t0 = $[3];
    }
    x.push(t0);
    $[0] = props.items;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: { edges: null, length: 0 } }],
};

```
      
### Eval output
(kind: ok) [0,[]]