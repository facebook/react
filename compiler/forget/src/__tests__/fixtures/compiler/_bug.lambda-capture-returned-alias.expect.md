
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
// Here, element should not be memoized independently of aliasedElement, since
// it is captured by fn.
// AnalyzeFunctions currently does not find captured objects.
//  - mutated context refs are declared as `Capture` effect in `FunctionExpression.deps`
//  - all other context refs are left as Unknown. InferReferenceEffects currently demotes
//    them to reads
function CaptureNotMutate(props) {
  const $ = React.unstable_useMemoCache(7);
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
  let t1;
  if (c_2) {
    t1 = bar(props.el);
    $[2] = props.el;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const element = t1;
  const c_4 = $[4] !== element;
  const c_5 = $[5] !== idx;
  let aliasedElement;
  if (c_4 || c_5) {
    const fn = function () {
      const arr = { element };
      return arr[idx];
    };
    aliasedElement = fn();
    mutate(aliasedElement);
    $[4] = element;
    $[5] = idx;
    $[6] = aliasedElement;
  } else {
    aliasedElement = $[6];
  }
  return aliasedElement;
}

```
      