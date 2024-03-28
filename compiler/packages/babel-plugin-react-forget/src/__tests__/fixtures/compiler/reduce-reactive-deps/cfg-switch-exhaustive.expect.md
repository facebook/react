
## Input

```javascript
// props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

function TestCondDepInSwitch(props, other) {
  const x = {};
  switch (foo(other)) {
    case 1:
      x.a = props.a.b;
      break;
    case 2:
      x.b = props.a.b;
      break;
    default:
      x.c = props.a.b;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

function TestCondDepInSwitch(props, other) {
  const $ = useMemoCache(3);
  let x;
  if ($[0] !== other || $[1] !== props.a.b) {
    x = {};
    bb1: switch (foo(other)) {
      case 1: {
        x.a = props.a.b;
        break bb1;
      }
      case 2: {
        x.b = props.a.b;
        break bb1;
      }
      default: {
        x.c = props.a.b;
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