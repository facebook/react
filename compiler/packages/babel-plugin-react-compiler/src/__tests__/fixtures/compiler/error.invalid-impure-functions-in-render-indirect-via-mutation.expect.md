
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

Error: Cannot access impure value during render

Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-functions-in-render-indirect-via-mutation.ts:10:23
   8 |   const array = [];
   9 |   arrayPush(array, now);
> 10 |   return <Foo hasDate={array} />;
     |                        ^^^^^ Cannot access impure value during render
  11 | }
  12 |
```
          
      