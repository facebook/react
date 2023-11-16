
## Input

```javascript
// @validateNoSetStateInRender
function Component(props) {
  const [x, setX] = useState(0);

  const foo = () => {
    setX(1);
  };

  const bar = () => {
    if (props.cond) {
      // This call is now conditional, so this should pass validation
      foo();
    }
  };

  const baz = () => {
    bar();
  };
  baz();

  return [x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: false }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @validateNoSetStateInRender
function Component(props) {
  const $ = useMemoCache(2);
  const [x, setX] = useState(0);

  const foo = () => {
    setX(1);
  };

  const bar = () => {
    if (props.cond) {
      foo();
    }
  };

  const baz = () => {
    bar();
  };

  baz();
  let t0;
  if ($[0] !== x) {
    t0 = [x];
    $[0] = x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: false }],
};

```
      
### Eval output
(kind: exception) useState is not defined
logs: ['The above error occurred in the <WrapperTestComponent> component:\n' +
  '\n' +
  '    at WrapperTestComponent (<project_root>/packages/sprout/dist/runner-evaluator.js:50:26)\n' +
  '\n' +
  'Consider adding an error boundary to your tree to customize error handling behavior.\n' +
  'Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.']