
## Input

```javascript
// Here, element should not be memoized independently of aliasedElement, since
// it is captured by fn.
// AnalyzeFunctions currently does not find captured objects.
//  - mutated context refs are declared as `Capture` effect in `FunctionExpression.deps`
//  - all other context refs are left as Unknown. InferReferenceEffects currently demotes
//    them to reads
function CaptureNotMutate(props) {
  const idx = foo(props.x);
  const element = bar(props.el);

  const fn = function () {
    const arr = { element };
    return arr[idx];
  };
  const aliasedElement = fn();
  mutate(aliasedElement);
  return aliasedElement;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // Here, element should not be memoized independently of aliasedElement, since
// it is captured by fn.
// AnalyzeFunctions currently does not find captured objects.
//  - mutated context refs are declared as `Capture` effect in `FunctionExpression.deps`
//  - all other context refs are left as Unknown. InferReferenceEffects currently demotes
//    them to reads
function CaptureNotMutate(props) {
  const $ = useMemoCache(5);
  const c_0 = $[0] !== props.x;
  let t0;
  if (c_0) {
    t0 = foo(props.x);
    $[0] = props.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const idx = t0;
  const c_2 = $[2] !== props.el;
  const c_3 = $[3] !== idx;
  let aliasedElement;
  if (c_2 || c_3) {
    const element = bar(props.el);

    const fn = function () {
      const arr = { element };
      return arr[idx];
    };

    aliasedElement = fn();
    mutate(aliasedElement);
    $[2] = props.el;
    $[3] = idx;
    $[4] = aliasedElement;
  } else {
    aliasedElement = $[4];
  }
  return aliasedElement;
}

```
      