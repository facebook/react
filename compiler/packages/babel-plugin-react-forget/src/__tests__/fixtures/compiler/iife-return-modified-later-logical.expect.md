
## Input

```javascript
function Component(props) {
  const items = (() => {
    return foo() ?? [];
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
  let t10;
  let items;
  if ($[0] !== props.a) {
    t10 = foo() ?? [];
    items = t10;

    items.push(props.a);
    $[0] = props.a;
    $[1] = items;
    $[2] = t10;
  } else {
    items = $[1];
    t10 = $[2];
  }
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: {} }],
};

```
      