
## Input

```javascript
function component(t) {
  let { a } = t;
  let y = { a };
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [{ a: 42 }],
};

```

## Code

```javascript
import { c as useMemoCache } from "react";
function component(t) {
  const $ = useMemoCache(2);
  const { a } = t;
  let t0;
  if ($[0] !== a) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const y = t0;
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [{ a: 42 }],
};

```
      
### Eval output
(kind: ok) {"a":42}