
## Input

```javascript
// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

function Component() {
  const now = Date.now();
  const renderItem = () => {
    const array = makeArray(now);
    const hasDate = identity(array);
    return <Bar hasDate={hasDate} />;
  };
  return <Foo renderItem={renderItem} />;
}

```


## Error

```
Found 2 errors:

Error: Cannot access impure value during render

Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-functions-in-render-via-render-helper.ts:10:25
   8 |     const array = makeArray(now);
   9 |     const hasDate = identity(array);
> 10 |     return <Bar hasDate={hasDate} />;
     |                          ^^^^^^^ Cannot access impure value during render
  11 |   };
  12 |   return <Foo renderItem={renderItem} />;
  13 | }

error.invalid-impure-functions-in-render-via-render-helper.ts:6:14
  4 |
  5 | function Component() {
> 6 |   const now = Date.now();
    |               ^^^^^^^^^^ `Date.now` is an impure function.
  7 |   const renderItem = () => {
  8 |     const array = makeArray(now);
  9 |     const hasDate = identity(array);

Error: Cannot access impure value during render

Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-functions-in-render-via-render-helper.ts:12:26
  10 |     return <Bar hasDate={hasDate} />;
  11 |   };
> 12 |   return <Foo renderItem={renderItem} />;
     |                           ^^^^^^^^^^ Cannot access impure value during render
  13 | }
  14 |

error.invalid-impure-functions-in-render-via-render-helper.ts:6:14
  4 |
  5 | function Component() {
> 6 |   const now = Date.now();
    |               ^^^^^^^^^^ `Date.now` is an impure function.
  7 |   const renderItem = () => {
  8 |     const array = makeArray(now);
  9 |     const hasDate = identity(array);
```
          
      