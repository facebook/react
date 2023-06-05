
## Input

```javascript
function Component(props) {
  const [x, setX] = useState(null);

  const onChange = (e) => {
    let x = null; // intentionally shadow the original x
    setX((currentX) => currentX + x); // intentionally refer to shadowed x
  };

  return <input value={x} onChange={onChange} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  const [x, setX] = useState(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (e) => {
      let x_0 = null; // intentionally shadow the original x
      setX((currentX) => currentX + x_0); // intentionally refer to shadowed x
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const onChange = t0;
  const c_1 = $[1] !== x;
  const c_2 = $[2] !== onChange;
  let t1;
  if (c_1 || c_2) {
    t1 = <input value={x} onChange={onChange} />;
    $[1] = x;
    $[2] = onChange;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      