
## Input

```javascript
// When a conditional dependency `props.a.b.c` has no unconditional dependency
// in its subpath or superpath, we should find the nearest unconditional access
// and promote it to an unconditional dependency.
function TestPromoteUnconditionalAccessToDependency(props, other) {
  const x = {};
  x.a = props.a.a.a;
  if (foo(other)) {
    x.c = props.a.b.c;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // When a conditional dependency `props.a.b.c` has no unconditional dependency
// in its subpath or superpath, we should find the nearest unconditional access
// and promote it to an unconditional dependency.
function TestPromoteUnconditionalAccessToDependency(props, other) {
  const $ = useMemoCache(3);
  let x;
  if ($[0] !== props.a || $[1] !== other) {
    x = {};
    x.a = props.a.a.a;
    if (foo(other)) {
      x.c = props.a.b.c;
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