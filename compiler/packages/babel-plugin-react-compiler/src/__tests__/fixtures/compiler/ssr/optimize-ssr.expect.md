
## Input

```javascript
// @enableOptimizeForSSR
function Component() {
  const [state, setState] = useState(0);
  const ref = useRef(null);
  const onChange = e => {
    setState(e.target.value);
  };
  useEffect(() => {
    log(ref.current.value);
  });
  return <input value={state} onChange={onChange} ref={ref} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableOptimizeForSSR
function Component() {
  const $ = _c(4);
  const [state, setState] = useState(0);
  const ref = useRef(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (e) => {
      setState(e.target.value);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const onChange = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      log(ref.current.value);
    };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  useEffect(t1);
  let t2;
  if ($[2] !== state) {
    t2 = <input value={state} onChange={onChange} ref={ref} />;
    $[2] = state;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

```
      