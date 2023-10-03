
## Input

```javascript
// @debug
function Component(props) {
  const FooContext = useContext(Foo);
  const onClick = () => {
    FooContext.current = true;
  };
  return <div onClick={onClick} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @debug
function Component(props) {
  const $ = useMemoCache(4);
  const FooContext = useContext(Foo);
  const c_0 = $[0] !== FooContext.current;
  let t0;
  if (c_0) {
    t0 = () => {
      FooContext.current = true;
    };
    $[0] = FooContext.current;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onClick = t0;
  const c_2 = $[2] !== onClick;
  let t1;
  if (c_2) {
    t1 = <div onClick={onClick} />;
    $[2] = onClick;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      