
## Input

```javascript
// @compilationMode(infer)
React.forwardRef(props => {
  return <div />;
});

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r; // @compilationMode(infer)
React.forwardRef((props) => {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
});

```
      