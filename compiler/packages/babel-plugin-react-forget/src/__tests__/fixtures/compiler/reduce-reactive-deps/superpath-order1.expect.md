
## Input

```javascript
// When an unconditional dependency `props.a` is the subpath of a conditional
// dependency `props.a.b`, we can safely overestimate and only track `props.a`
// as a dependency
// ordering of accesses should not matter
function TestConditionalSuperpath1(props, other) {
  const x = {};
  x.a = props.a;
  if (foo(other)) {
    x.b = props.a.b;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // When an unconditional dependency `props.a` is the subpath of a conditional
// dependency `props.a.b`, we can safely overestimate and only track `props.a`
// as a dependency
// ordering of accesses should not matter
function TestConditionalSuperpath1(props, other) {
  const $ = useMemoCache(3);
  let x;
  if ($[0] !== props.a || $[1] !== other) {
    x = {};
    x.a = props.a;
    if (foo(other)) {
      x.b = props.a.b;
    }
    $[0] = props.a;
    $[1] = other;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      
### Eval output
(kind: exception) Fixture not implemented!
logs: ['The above error occurred in the <WrapperTestComponent> component:\n' +
  '\n' +
  '    at WrapperTestComponent (<project_root>/packages/snap/dist/sprout/evaluator.js:54:26)\n' +
  '\n' +
  'Consider adding an error boundary to your tree to customize error handling behavior.\n' +
  'Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.']