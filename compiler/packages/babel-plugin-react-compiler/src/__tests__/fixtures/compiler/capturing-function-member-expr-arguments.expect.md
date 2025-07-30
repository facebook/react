
## Input

```javascript
function Foo(props) {
  const onFoo = useCallback(
    reason => {
      log(props.router.location);
    },
    [props.router.location]
  );

  return onFoo;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Foo(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.router) {
    t0 = (reason) => {
      log(props.router.location);
    };
    $[0] = props.router;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onFoo = t0;
  return onFoo;
}

```
      