
## Input

```javascript
// Valid because hooks can be used in anonymous function arguments to
// forwardRef.
const FancyButton = forwardRef(function (props, ref) {
  useHook();
  return <button {...props} ref={ref} />;
});

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // Valid because hooks can be used in anonymous function arguments to
// forwardRef.
const FancyButton = forwardRef(function (props, ref) {
  const $ = useMemoCache(3);
  useHook();
  const c_0 = $[0] !== props;
  const c_1 = $[1] !== ref;
  let t0;
  if (c_0 || c_1) {
    t0 = <button {...props} ref={ref} />;
    $[0] = props;
    $[1] = ref;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
});

```
      