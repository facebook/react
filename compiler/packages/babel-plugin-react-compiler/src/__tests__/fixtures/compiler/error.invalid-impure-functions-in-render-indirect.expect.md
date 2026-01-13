
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

Error: Cannot access impure value during render

Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-functions-in-render-indirect.ts:9:23
   7 |   const array = makeArray(getDate());
   8 |   const hasDate = identity(array);
>  9 |   return <Foo hasDate={hasDate} />;
     |                        ^^^^^^^ Cannot access impure value during render
  10 | }
  11 |
```
          
      