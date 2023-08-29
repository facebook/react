
## Input

```javascript
// Valid because hooks can be used in anonymous function arguments to
// memo.
const MemoizedFunction = memo(function (props) {
  useHook();
  return <button {...props} />;
});

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // Valid because hooks can be used in anonymous function arguments to
// memo.
const MemoizedFunction = memo(function (props) {
  const $ = useMemoCache(2);
  useHook();
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    t0 = <button {...props} />;
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
});

```
      