
## Input

```javascript
// @enableEmitFreeze @instrumentForget

function useFoo(props) {
  return foo(props.x);
}

```

## Code

```javascript
import { useRenderCounter, makeReadOnly } from "react-forget-runtime";
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableEmitFreeze @instrumentForget

function useFoo(props) {
  if (__DEV__) useRenderCounter("useFoo");
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== props.x) {
    t0 = foo(props.x);
    $[0] = props.x;
    $[1] = __DEV__ ? makeReadOnly(t0, "useFoo") : t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      