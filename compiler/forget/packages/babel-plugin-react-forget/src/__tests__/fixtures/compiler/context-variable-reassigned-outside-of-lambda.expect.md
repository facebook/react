
## Input

```javascript
// @debug
function Component(props) {
  let x = null;
  const onChange = (e) => {
    console.log(x);
  };
  x = {};
  return <Foo onChange={onChange} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @debug
function Component(props) {
  const $ = useMemoCache(2);
  let onChange;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let x;
    x = null;
    onChange = (e) => {
      console.log(x);
    };

    x = {};
    $[0] = onChange;
  } else {
    onChange = $[0];
  }
  let t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Foo onChange={onChange} />;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      