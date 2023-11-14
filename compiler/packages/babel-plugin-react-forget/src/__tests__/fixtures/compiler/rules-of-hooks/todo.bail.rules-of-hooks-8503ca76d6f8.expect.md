
## Input

```javascript
// @skip
// Unsupported input

// Invalid because it's a common misunderstanding.
// We *could* make it valid but the runtime error could be confusing.
const ComponentWithHookInsideCallback = React.memo((props) => {
  useEffect(() => {
    useHookInsideCallback();
  });
  return <button {...props} />;
});

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @skip
// Unsupported input

// Invalid because it's a common misunderstanding.
// We *could* make it valid but the runtime error could be confusing.
const ComponentWithHookInsideCallback = React.memo((props) => {
  const $ = useMemoCache(3);
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
  if ($[1] !== props) {
    t1 = <button {...props} />;
    $[1] = props;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
});

```
      