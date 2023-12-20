
## Input

```javascript
function Component({ useFeature }) {
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
function Component(t28) {
  const $ = useMemoCache(8);
  const { useFeature } = t28;
  let x;
  if (useFeature) {
    const t0 = useFeature + useFeature;
    let t1;
    if ($[0] !== t0 || $[1] !== useFeature) {
      t1 = [t0].push(-useFeature);
      $[0] = t0;
      $[1] = useFeature;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    x = t1;
  }

  const y = useFeature;
  const z = useFeature.useProperty;
  let t2;
  if ($[3] !== useFeature || $[4] !== x || $[5] !== y || $[6] !== z) {
    t2 = (
      <div onClick={useFeature}>
        {x}
        {y}
        {z}
      </div>
    );
    $[3] = useFeature;
    $[4] = x;
    $[5] = y;
    $[6] = z;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: exception) Cannot read properties of undefined (reading 'useProperty')
logs: ['The above error occurred in the <WrapperTestComponent> component:\n' +
  '\n' +
  '    at WrapperTestComponent (<project_root>/packages/sprout/dist/runner-evaluator.js:55:26)\n' +
  '\n' +
  'Consider adding an error boundary to your tree to customize error handling behavior.\n' +
  'Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.']