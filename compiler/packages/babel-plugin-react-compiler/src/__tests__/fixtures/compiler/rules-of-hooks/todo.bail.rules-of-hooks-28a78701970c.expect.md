
## Input

```javascript
// @skip
// Unsupported input

// Valid because hooks can be used in anonymous function arguments to
// React.memo.
const MemoizedFunction = React.memo(props => {
  useHook();
  return <button {...props} />;
});

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r; // @skip
// Unsupported input

// Valid because hooks can be used in anonymous function arguments to
// React.memo.
const MemoizedFunction = React.memo((props) => {
  const $ = _c(2);
  useHook();
  let t0;
  if ($[0] !== props) {
    t0 = <button {...props} />;
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
});

```
      