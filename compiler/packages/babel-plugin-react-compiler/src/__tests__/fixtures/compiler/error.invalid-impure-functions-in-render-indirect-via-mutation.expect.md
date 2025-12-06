
## Input

```javascript
// @validateNoImpureFunctionsInRender

import {arrayPush, identity, makeArray} from 'shared-runtime';

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

Error: Cannot call impure function during render

`Date.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-functions-in-render-indirect-via-mutation.ts:9:19
   7 |   const now = getDate();
   8 |   const array = [];
>  9 |   arrayPush(array, now);
     |                    ^^^ Cannot reference impure value during render
  10 |   return <Foo hasDate={array} />;
  11 | }
  12 |

error.invalid-impure-functions-in-render-indirect-via-mutation.ts:6:24
  4 |
  5 | function Component() {
> 6 |   const getDate = () => Date.now();
    |                         ^^^^^^^^^^ Cannot call impure function
  7 |   const now = getDate();
  8 |   const array = [];
  9 |   arrayPush(array, now);
```
          
      