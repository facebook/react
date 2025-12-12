
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
Found 1 error:

Error: Cannot call impure function during render

`Date.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-functions-in-render-via-render-helper.ts:8:28
   6 |   const now = Date.now();
   7 |   const renderItem = () => {
>  8 |     const array = makeArray(now);
     |                             ^^^ Cannot reference impure value during render
   9 |     const hasDate = identity(array);
  10 |     return <Bar hasDate={hasDate} />;
  11 |   };

error.invalid-impure-functions-in-render-via-render-helper.ts:6:14
  4 |
  5 | function Component() {
> 6 |   const now = Date.now();
    |               ^^^^^^^^^^ Cannot call impure function
  7 |   const renderItem = () => {
  8 |     const array = makeArray(now);
  9 |     const hasDate = identity(array);
```
          
      