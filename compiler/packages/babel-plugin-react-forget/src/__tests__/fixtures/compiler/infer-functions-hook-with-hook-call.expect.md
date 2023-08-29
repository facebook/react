
## Input

```javascript
// @enableInferReactFunctions
function useStateValue(props) {
  const [state, _] = useState(null);
  return [state];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableInferReactFunctions
function useStateValue(props) {
  const $ = useMemoCache(2);
  const [state] = useState(null);
  const c_0 = $[0] !== state;
  let t0;
  if (c_0) {
    t0 = [state];
    $[0] = state;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      