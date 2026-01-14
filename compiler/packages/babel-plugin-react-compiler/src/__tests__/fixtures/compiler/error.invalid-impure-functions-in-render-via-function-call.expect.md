
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

Error: Cannot access impure value during render

Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-functions-in-render-via-function-call.ts:13:23
  11 |   };
  12 |   const hasDate = f();
> 13 |   return <Foo hasDate={hasDate} />;
     |                        ^^^^^^^ Cannot access impure value during render
  14 | }
  15 |

error.invalid-impure-functions-in-render-via-function-call.ts:6:14
  4 |
  5 | function Component() {
> 6 |   const now = Date.now();
    |               ^^^^^^^^^^ `Date.now` is an impure function.
  7 |   const f = () => {
  8 |     const array = makeArray(now);
  9 |     const hasDate = identity(array);
```
          
      