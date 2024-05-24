
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
import { c as _c } from "react/compiler-runtime"; // Here, element should not be memoized independently of aliasedElement, since
// it is captured by fn.
// AnalyzeFunctions currently does not find captured objects.
//  - mutated context refs are declared as `Capture` effect in `FunctionExpression.deps`
//  - all other context refs are left as Unknown. InferReferenceEffects currently demotes
//    them to reads
function CaptureNotMutate(props) {
  const $ = _c(5);
  let t0;
  if ($[0] !== props.el || $[1] !== props.x) {
    const element = bar(props.el);
    let t1;
    if ($[3] !== props.x) {
      t1 = foo(props.x);
      $[3] = props.x;
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    const idx = t1;

    const fn = function () {
      const arr = { element };
      return arr[idx];
    };

    const aliasedElement = fn();

    t0 = aliasedElement;
    mutate(aliasedElement);
    $[0] = props.el;
    $[1] = props.x;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      