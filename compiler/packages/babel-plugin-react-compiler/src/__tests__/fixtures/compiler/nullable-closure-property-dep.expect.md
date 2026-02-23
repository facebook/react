
## Input

```javascript
// Closure property accesses on nullable objects should not be eagerly
// evaluated as cache keys. The compiler must not hoist `user.name` out
// of the closure when `user` could be null at render time.
const MyComponent = ({user}) => {
  const handleClick = () => {
    console.log(user.name);
  };

  if (!user) return null;

  return <button onClick={handleClick}>Click</button>;
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // Closure property accesses on nullable objects should not be eagerly
// evaluated as cache keys. The compiler must not hoist `user.name` out
// of the closure when `user` could be null at render time.
const MyComponent = (t0) => {
  const $ = _c(4);
  const { user } = t0;
  let t1;
  if ($[0] !== user) {
    t1 = () => {
      console.log(user.name);
    };
    $[0] = user;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleClick = t1;

  if (!user) {
    return null;
  }
  let t2;
  if ($[2] !== handleClick) {
    t2 = <button onClick={handleClick}>Click</button>;
    $[2] = handleClick;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
};

```
      
### Eval output
(kind: exception) Fixture not implemented