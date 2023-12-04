
## Input

```javascript
import { makeObject_Primitives } from "shared-runtime";

function Component(props) {
  let useFeature = makeObject_Primitives();
  let x;
  if (useFeature) {
    x = [useFeature + useFeature].push(-useFeature);
  }
  let y = useFeature;
  let z = useFeature.useProperty;
  return (
    <div onClick={useFeature}>
      {x}
      {y}
      {z}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { makeObject_Primitives } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(2);
  const useFeature = makeObject_Primitives();
  let x;
  if (useFeature) {
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = [useFeature + useFeature].push(-useFeature);
      $[0] = t0;
    } else {
      t0 = $[0];
    }
    x = t0;
  }

  const y = useFeature;
  const z = useFeature.useProperty;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (
      <div onClick={useFeature}>
        {x}
        {y}
        {z}
      </div>
    );
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: exception) Objects are not valid as a React child (found: object with keys {a, b, c}). If you meant to render a collection of children, use an array instead.
logs: ['The above error occurred in the <div> component:\n' +
  '\n' +
  '    at div\n' +
  '    at WrapperTestComponent (<project_root>/packages/sprout/dist/runner-evaluator.js:50:26)\n' +
  '\n' +
  'Consider adding an error boundary to your tree to customize error handling behavior.\n' +
  'Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.']