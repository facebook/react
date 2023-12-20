
## Input

```javascript
function hoisting() {
  function onClick(x) {
    return x + bar["baz"];
  }
  function onClick2(x) {
    return x + bar[baz];
  }
  const baz = "baz";
  const bar = { baz: 1 };

  return <Button onClick={onClick} onClick2={onClick2} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function hoisting() {
  const $ = useMemoCache(3);
  let onClick;
  let onClick2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    onClick = function onClick(x) {
      return x + bar.baz;
    };

    onClick2 = function onClick2(x_0) {
      return x_0 + bar[baz];
    };

    const baz = "baz";
    const bar = { baz: 1 };
    $[0] = onClick;
    $[1] = onClick2;
  } else {
    onClick = $[0];
    onClick2 = $[1];
  }
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Button onClick={onClick} onClick2={onClick2} />;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
};

```
      
### Eval output
(kind: exception) Button is not defined
logs: ['The above error occurred in the <WrapperTestComponent> component:\n' +
  '\n' +
  '    at WrapperTestComponent (<project_root>/packages/sprout/dist/runner-evaluator.js:55:26)\n' +
  '\n' +
  'Consider adding an error boundary to your tree to customize error handling behavior.\n' +
  'Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.']