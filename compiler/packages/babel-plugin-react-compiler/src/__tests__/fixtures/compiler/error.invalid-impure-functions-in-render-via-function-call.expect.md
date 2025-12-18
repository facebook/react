
## Input

```javascript
// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

function Component() {
  const now = Date.now();
  const f = () => {
    const array = makeArray(now);
    const hasDate = identity(array);
    return hasDate;
  };
  const hasDate = f();
  return <Foo hasDate={hasDate} />;
}

```


## Error

```
Found 1 error:

Error: Cannot call impure function during render

`Date.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-functions-in-render-via-function-call.ts:12:18
  10 |     return hasDate;
  11 |   };
> 12 |   const hasDate = f();
     |                   ^ Cannot reference impure value during render
  13 |   return <Foo hasDate={hasDate} />;
  14 | }
  15 |

error.invalid-impure-functions-in-render-via-function-call.ts:6:14
  4 |
  5 | function Component() {
> 6 |   const now = Date.now();
    |               ^^^^^^^^^^ Cannot call impure function
  7 |   const f = () => {
  8 |     const array = makeArray(now);
  9 |     const hasDate = identity(array);
```
          
      