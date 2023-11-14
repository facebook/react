
## Input

```javascript
function Component(props) {
  const FooContext = useContext(Foo);
  // This function should be memoized, but its mutable range is entangled
  // with the useContext call. We can't memoize hooks, therefore the
  // reactive scope around the hook + callback is pruned and we're left
  // w no memoization of the callback.
  //
  // Ideally we'd determine that this isn't called during render and can
  // therefore be considered "immutable" or otherwise safe to memoize
  // independently
  const onClick = () => {
    FooContext.current = true;
  };
  return <div onClick={onClick} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const FooContext = useContext(Foo);

  const onClick = () => {
    FooContext.current = true;
  };
  let t0;
  if ($[0] !== onClick) {
    t0 = <div onClick={onClick} />;
    $[0] = onClick;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      