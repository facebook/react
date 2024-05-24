
## Input

```javascript
function Component(props) {
  const x = 42;
  const onEvent = () => {
    console.log(x);
  };
  return <Foo onEvent={onEvent} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const onEvent = () => {
      console.log(42);
    };

    t0 = <Foo onEvent={onEvent} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      