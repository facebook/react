
## Input

```javascript
// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

function Component() {
  const now = () => Date.now();
  const f = () => {
    // this should error but we currently lose track of the impurity bc
    // the impure value comes from behind a call
    const array = makeArray(now());
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

error.invalid-impure-functions-in-render-via-function-call-2.ts:15:23
  13 |   };
  14 |   const hasDate = f();
> 15 |   return <Foo hasDate={hasDate} />;
     |                        ^^^^^^^ Cannot access impure value during render
  16 | }
  17 |

error.invalid-impure-functions-in-render-via-function-call-2.ts:6:20
  4 |
  5 | function Component() {
> 6 |   const now = () => Date.now();
    |                     ^^^^^^^^^^ `Date.now` is an impure function.
  7 |   const f = () => {
  8 |     // this should error but we currently lose track of the impurity bc
  9 |     // the impure value comes from behind a call
```
          
      