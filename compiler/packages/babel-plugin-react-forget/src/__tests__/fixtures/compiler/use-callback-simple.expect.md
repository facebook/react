
## Input

```javascript
function component() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount(count + 1));

  return <Foo onClick={increment}></Foo>;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(4);
  const [count, setCount] = useState(0);
  const c_0 = $[0] !== count;
  let t0;
  if (c_0) {
    t0 = () => setCount(count + 1);
    $[0] = count;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const increment = t0;
  const c_2 = $[2] !== increment;
  let t1;
  if (c_2) {
    t1 = <Foo onClick={increment} />;
    $[2] = increment;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      