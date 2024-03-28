
## Input

```javascript
// When an object's properties are only read conditionally, we should
// track the base object as a dependency.
function TestOnlyConditionalDependencies(props, other) {
  const x = {};
  if (foo(other)) {
    x.b = props.a.b;
    x.c = props.a.b.c;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // When an object's properties are only read conditionally, we should
// track the base object as a dependency.
function TestOnlyConditionalDependencies(props, other) {
  const $ = useMemoCache(3);
  let x;
  if ($[0] !== other || $[1] !== props) {
    x = {};
    if (foo(other)) {
      x.b = props.a.b;
      x.c = props.a.b.c;
    }
    $[0] = other;
    $[1] = props;
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