
## Input

```javascript
// @enableMergeConsecutiveScopes
function Component(props) {
  // start of scope for y, depend on props.a
  let y = {};

  // nested scope for x, dependent on props.a
  const x = {};
  mutate(x, props.a);
  // end of scope for x

  y.a = props.a;
  y.x = x;
  // end of scope for y

  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableMergeConsecutiveScopes
function Component(props) {
  const $ = useMemoCache(2);
  let y;
  if ($[0] !== props.a) {
    y = {};

    const x = {};
    mutate(x, props.a);

    y.a = props.a;
    y.x = x;
    $[0] = props.a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 42 }],
};

```
      
### Eval output
(kind: exception) mutate is not defined
logs: ['The above error occurred in the <WrapperTestComponent> component:\n' +
  '\n' +
  '    at WrapperTestComponent (<project_root>/packages/sprout/dist/runner-evaluator.js:50:26)\n' +
  '\n' +
  'Consider adding an error boundary to your tree to customize error handling behavior.\n' +
  'Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.']