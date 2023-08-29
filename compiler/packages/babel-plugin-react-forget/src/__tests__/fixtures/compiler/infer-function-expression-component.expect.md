
## Input

```javascript
// @compilationMode(infer)

const Component = function ComponentName(props) {
  return <Foo />;
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @compilationMode(infer)

const Component = function ComponentName(props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Foo />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
};

```
      