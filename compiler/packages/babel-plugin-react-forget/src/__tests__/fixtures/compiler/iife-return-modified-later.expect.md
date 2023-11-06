
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
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let t4;
  let items;
  if ($[0] !== props.a) {
    t4 = [];
    items = t4;

    items.push(props.a);
    $[0] = props.a;
    $[1] = items;
    $[2] = t4;
  } else {
    items = $[1];
    t4 = $[2];
  }
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: {} }],
};

```
      