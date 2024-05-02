
## Input

```javascript
function Component(props) {
  const x = 42;
  const onEvent = () => {
    console.log(x);
  };
  return <Foo onEvent={onEvent} />;
}

```

## Code

```javascript
import { c as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      console.log(42);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const onEvent = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <Foo onEvent={onEvent} />;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      