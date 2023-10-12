
## Input

```javascript
// @compilationMode(infer)
function useStateValue(props) {
  const [state, _] = useState(null);
  return [state];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @compilationMode(infer)
function useStateValue(props) {
  const $ = useMemoCache(2);
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
      