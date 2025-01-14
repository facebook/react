
## Input

```javascript
function foo() {
  const isX = GLOBAL_IS_X;
  const getJSX = () => {
    return <Child x={isX}></Child>;
  };
  const result = getJSX();
  return result;
}

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function foo() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const getJSX = () => <Child x={GLOBAL_IS_X} />;

    t0 = getJSX();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const result = t0;
  return result;
}

```
      