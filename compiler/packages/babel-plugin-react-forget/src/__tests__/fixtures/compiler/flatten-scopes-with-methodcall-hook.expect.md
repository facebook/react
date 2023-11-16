
## Input

```javascript
const { ObjectWithHooks } = require("shared-runtime");

function Component(props) {
  const x = [];
  const [y] = ObjectWithHooks.useFoo();
  x.push(y);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
const { ObjectWithHooks } = require("shared-runtime");

function Component(props) {
  const x = [];
  const [y] = ObjectWithHooks.useFoo();
  x.push(y);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: exception) number 0 is not iterable (cannot read property Symbol(Symbol.iterator))
logs: ['The above error occurred in the <WrapperTestComponent> component:\n' +
  '\n' +
  '    at WrapperTestComponent (<project_root>/packages/sprout/dist/runner-evaluator.js:50:26)\n' +
  '\n' +
  'Consider adding an error boundary to your tree to customize error handling behavior.\n' +
  'Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.']