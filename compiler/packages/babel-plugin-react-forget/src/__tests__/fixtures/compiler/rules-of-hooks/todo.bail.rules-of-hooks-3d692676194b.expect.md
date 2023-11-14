
## Input

```javascript
// @skip
// Unsupported input

// Invalid because it's a common misunderstanding.
// We *could* make it valid but the runtime error could be confusing.
const ComponentWithHookInsideCallback = React.forwardRef((props, ref) => {
  useEffect(() => {
    useHookInsideCallback();
  });
  return <button {...props} ref={ref} />;
});

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @skip
// Unsupported input

// Invalid because it's a common misunderstanding.
// We *could* make it valid but the runtime error could be confusing.
const ComponentWithHookInsideCallback = React.forwardRef((props, ref) => {
  const $ = useMemoCache(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      useHookInsideCallback();
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  useEffect(t0);
  let t1;
  if ($[1] !== props || $[2] !== ref) {
    t1 = <button {...props} ref={ref} />;
    $[1] = props;
    $[2] = ref;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
});

```
      