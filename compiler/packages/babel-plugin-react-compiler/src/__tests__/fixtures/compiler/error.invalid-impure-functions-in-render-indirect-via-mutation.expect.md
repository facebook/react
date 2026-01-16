
## Input

```javascript
// @validateNoImpureFunctionsInRender

import {arrayPush, identity, makeArray} from 'shared-runtime';

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render. The impurity is lost
 * when passed through external function calls.
 */
function Component() {
  const getDate = () => Date.now();
  const now = getDate();
  const array = [];
  arrayPush(array, now);
  return <Foo hasDate={array} />;
}

```


## Error

```
Found 1 error:

Error: Cannot access impure value during render

Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-functions-in-render-indirect-via-mutation.ts:15:23
  13 |   const array = [];
  14 |   arrayPush(array, now);
> 15 |   return <Foo hasDate={array} />;
     |                        ^^^^^ Cannot access impure value during render
  16 | }
  17 |

error.invalid-impure-functions-in-render-indirect-via-mutation.ts:11:24
   9 |  */
  10 | function Component() {
> 11 |   const getDate = () => Date.now();
     |                         ^^^^^^^^^^ `Date.now` is an impure function.
  12 |   const now = getDate();
  13 |   const array = [];
  14 |   arrayPush(array, now);
```
          
      