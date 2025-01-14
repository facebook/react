
## Input

```javascript
// @compilationMode(infer)
function Component(props) {
  const [state, _] = useState(null);
  return [state];
}

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r; // @compilationMode(infer)
function Component(props) {
  const $ = _c(2);
  const [state] = useState(null);
  let t0;
  if ($[0] !== state) {
    t0 = [state];
    $[0] = state;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      