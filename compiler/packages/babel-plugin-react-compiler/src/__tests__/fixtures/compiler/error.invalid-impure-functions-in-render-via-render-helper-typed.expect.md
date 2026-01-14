
## Input

```javascript
// @validateNoImpureFunctionsInRender

import {typedArrayPush, typedIdentity} from 'shared-runtime';

function Component() {
  const now = Date.now();
  const renderItem = () => {
    const array = [];
    typedArrayPush(array, now());
    const hasDate = typedIdentity(array);
    return <Bar hasDate={hasDate} />;
  };
  return <Foo renderItem={renderItem} />;
}

```


## Error

```
Found 1 error:

Error: Cannot access impure value during render

Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-functions-in-render-via-render-helper-typed.ts:13:26
  11 |     return <Bar hasDate={hasDate} />;
  12 |   };
> 13 |   return <Foo renderItem={renderItem} />;
     |                           ^^^^^^^^^^ Cannot access impure value during render
  14 | }
  15 |

error.invalid-impure-functions-in-render-via-render-helper-typed.ts:6:14
  4 |
  5 | function Component() {
> 6 |   const now = Date.now();
    |               ^^^^^^^^^^ `Date.now` is an impure function.
  7 |   const renderItem = () => {
  8 |     const array = [];
  9 |     typedArrayPush(array, now());
```
          
      