
## Input

```javascript
function Component(props) {
  const ref = useRef(null);
  const onChange = (e) => {
    const newValue = e.target.value ?? ref.current;
    ref.current = newValue;
  };
  useEffect(() => {
    console.log(ref.current);
  });
  return <Foo onChange={onChange} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  const ref = useRef(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (e) => {
      const newValue = e.target.value ?? ref.current;
      ref.current = newValue;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const onChange = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      console.log(ref.current);
    };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  useEffect(t1);
  const c_2 = $[2] !== onChange;
  let t2;
  if (c_2) {
    t2 = <Foo onChange={onChange} />;
    $[2] = onChange;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

```
      