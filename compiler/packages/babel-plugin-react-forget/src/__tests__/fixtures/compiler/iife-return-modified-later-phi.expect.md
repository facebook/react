
## Input

```javascript
function Component(props) {
  const items = (() => {
    if (props.cond) {
      return [];
    } else {
      return null;
    }
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
  let items;
  if ($[0] !== props.cond || $[1] !== props.a) {
    let t9;
    if (props.cond) {
      t9 = [];
    } else {
      t9 = null;
    }
    items = t9;

    items.push(props.a);
    $[0] = props.cond;
    $[1] = props.a;
    $[2] = items;
  } else {
    items = $[2];
  }
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: {} }],
};

```
      