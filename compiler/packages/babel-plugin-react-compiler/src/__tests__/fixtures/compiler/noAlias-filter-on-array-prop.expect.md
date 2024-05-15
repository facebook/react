
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(3);
  let t0;
  if ($[0] !== props.items) {
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = (item) => item != null;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    t0 = props.items.filter(t1);
    $[0] = props.items;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const filtered = t0;
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