
## Input

```javascript
// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

function Component() {
  const getDate = () => Date.now();
  const array = makeArray(getDate());
  const hasDate = identity(array);
  return <Foo hasDate={hasDate} />;
}

```


## Error

```
Found 1 error:

Error: Cannot call impure function during render

`Date.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-functions-in-render-indirect.ts:6:24
  4 |
  5 | function Component() {
> 6 |   const getDate = () => Date.now();
    |                         ^^^^^^^^^^ Cannot call impure function
  7 |   const array = makeArray(getDate());
  8 |   const hasDate = identity(array);
  9 |   return <Foo hasDate={hasDate} />;
```
          
      