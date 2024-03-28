
## Input

```javascript
// props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

function TestCondDepInNestedIfElse(props, other) {
  const x = {};
  if (foo(other)) {
    if (bar()) {
      x.a = props.a.b;
    } else {
      x.b = props.a.b;
    }
  } else if (baz(other)) {
    x.c = props.a.b;
  } else {
    x.d = props.a.b;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

function TestCondDepInNestedIfElse(props, other) {
  const $ = useMemoCache(3);
  let x;
  if ($[0] !== other || $[1] !== props.a.b) {
    x = {};
    if (foo(other)) {
      if (bar()) {
        x.a = props.a.b;
      } else {
        x.b = props.a.b;
      }
    } else {
      if (baz(other)) {
        x.c = props.a.b;
      } else {
        x.d = props.a.b;
      }
    }
    $[0] = other;
    $[1] = props.a.b;
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