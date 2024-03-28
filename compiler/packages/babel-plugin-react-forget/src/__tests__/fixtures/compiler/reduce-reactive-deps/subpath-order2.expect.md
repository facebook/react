
## Input

```javascript
// When a conditional dependency `props.a` is a subpath of an unconditional
// dependency `props.a.b`, we can access `props.a` while preserving program
// semantics (with respect to nullthrows).
// deps: {`props.a`, `props.a.b`} can further reduce to just `props.a`
// ordering of accesses should not matter
function TestConditionalSubpath2(props, other) {
  const x = {};
  if (foo(other)) {
    x.a = props.a;
  }
  x.b = props.a.b;
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // When a conditional dependency `props.a` is a subpath of an unconditional
// dependency `props.a.b`, we can access `props.a` while preserving program
// semantics (with respect to nullthrows).
// deps: {`props.a`, `props.a.b`} can further reduce to just `props.a`
// ordering of accesses should not matter
function TestConditionalSubpath2(props, other) {
  const $ = useMemoCache(3);
  let x;
  if ($[0] !== other || $[1] !== props.a) {
    x = {};
    if (foo(other)) {
      x.a = props.a;
    }

    x.b = props.a.b;
    $[0] = other;
    $[1] = props.a;
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