
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(4);
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
  if ($[1] !== onChange) {
    t1 = <Foo onChange={onChange} />;
    $[1] = onChange;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      console.log(ref.current);
    };
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  useEffect(t2);
  return t1;
}

```
      