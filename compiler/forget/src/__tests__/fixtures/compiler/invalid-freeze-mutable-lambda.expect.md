
## Input

```javascript
function Component(props) {
  const [x, setX] = useState({ value: "" });
  const onChange = (e) => {
    // INVALID! should use copy-on-write and pass the new value
    x.value = e.target.value;
    setX(x);
  };
  return <input value={x.value} onChange={onChange} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(6);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { value: "" };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const [x, setX] = useState(t0);
  const c_1 = $[1] !== x;
  let t1;
  if (c_1) {
    t1 = (e) => {
      // INVALID! should use copy-on-write and pass the new value
      x.value = e.target.value;
      setX(x);
    };
    $[1] = x;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const onChange = t1;
  const c_3 = $[3] !== x.value;
  const c_4 = $[4] !== onChange;
  let t2;
  if (c_3 || c_4) {
    t2 = <input value={x.value} onChange={onChange} />;
    $[3] = x.value;
    $[4] = onChange;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

```
      