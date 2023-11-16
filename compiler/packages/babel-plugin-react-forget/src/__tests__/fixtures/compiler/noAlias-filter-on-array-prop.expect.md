
## Input

```javascript
function Component(props) {
  const filtered = props.items.filter((item) => item != null);
  return filtered;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      items: [
        { a: true },
        null,
        true,
        false,
        null,
        "string",
        3.14,
        null,
        [null],
      ],
    },
  ],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let t1;
  if ($[0] !== props.items) {
    let t0;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = (item) => item != null;
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    t1 = props.items.filter(t0);
    $[0] = props.items;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const filtered = t1;
  return filtered;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      items: [
        { a: true },
        null,
        true,
        false,
        null,
        "string",
        3.14,
        null,
        [null],
      ],
    },
  ],
};

```
      
### Eval output
(kind: ok) [{"a":true},true,false,"string",3.14,[null]]