
## Input

```javascript
import {useRef} from 'react';

function Component() {
  const ref = useRef(undefined);
  if (ref.current === undefined) {
    ref.current = "initialized";
  }
  return <div>Hello World</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};
```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useRef } from "react";

function Component() {
  const $ = _c(1);
  const ref = useRef(undefined);
  if (ref.current === undefined) {
    ref.current = "initialized";
  }
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div>Hello World</div>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>Hello World</div>