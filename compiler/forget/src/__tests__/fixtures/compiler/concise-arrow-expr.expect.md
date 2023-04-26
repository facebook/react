
## Input

```javascript
function component() {
  let [x, setX] = useState(0);
  const handler = (v) => setX(v);
  return <Foo handler={handler}></Foo>;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(4);
  const [x, setX] = useState(0);
  const c_0 = $[0] !== setX;
  let t0;
  if (c_0) {
    t0 = (v) => setX(v);
    $[0] = setX;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const handler = t0;
  const c_2 = $[2] !== handler;
  let t1;
  if (c_2) {
    t1 = <Foo handler={handler} />;
    $[2] = handler;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      