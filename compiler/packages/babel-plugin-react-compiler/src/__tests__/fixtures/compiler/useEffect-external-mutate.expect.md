
## Input

```javascript
import { useEffect } from "react";

let x = { a: 42 };

function Component(props) {
  useEffect(() => {
    x.a = 10;
  });
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
import { useEffect } from "react";

let x = { a: 42 };

function Component(props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      x.a = 10;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  useEffect(t0);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) 