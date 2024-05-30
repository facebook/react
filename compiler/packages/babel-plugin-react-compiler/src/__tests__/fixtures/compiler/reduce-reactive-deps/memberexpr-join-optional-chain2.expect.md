
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
  params: [{ items: { edges: null, length: 0 } }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.items) {
    const x = [];
    x.push(props.items?.length);

    t0 = x;
    x.push(props.items?.edges?.map?.(render)?.filter?.(Boolean) ?? []);
    $[0] = props.items;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: { edges: null, length: 0 } }],
};

```
      
### Eval output
(kind: ok) [0,[]]