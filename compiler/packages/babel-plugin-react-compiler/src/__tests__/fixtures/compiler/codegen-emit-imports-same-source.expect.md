
## Input

```javascript
// @enableEmitFreeze @instrumentForget

function useFoo(props) {
  return foo(props.x);
}

```

## Code

```javascript
import {
  useRenderCounter,
  shouldInstrument,
  makeReadOnly,
} from "react-compiler-runtime";
import { c as _c } from "react/compiler-runtime"; // @enableEmitFreeze @instrumentForget

function useFoo(props) {
  if (__DEV__ && shouldInstrument)
    useRenderCounter("useFoo", "/codegen-emit-imports-same-source.ts");
  const $ = _c(2);
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
      