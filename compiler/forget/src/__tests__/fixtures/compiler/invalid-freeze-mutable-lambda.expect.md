
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
  const $ = useMemoCache(7);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { value: "" };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const [x, setX] = useState(t0);
  const c_1 = $[1] !== x;
  const c_2 = $[2] !== setX;
  let t1;
  if (c_1 || c_2) {
    t1 = (e) => {
      // INVALID! should use copy-on-write and pass the new value
      x.value = e.target.value;
      setX(x);
    };
    $[1] = x;
    $[2] = setX;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const onChange = t1;
  const c_4 = $[4] !== x.value;
  const c_5 = $[5] !== onChange;
  let t2;
  if (c_4 || c_5) {
    t2 = <input value={x.value} onChange={onChange} />;
    $[4] = x.value;
    $[5] = onChange;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      