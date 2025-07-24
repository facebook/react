
## Input

```javascript
/* eslint-disable react-hooks/rules-of-hooks */
function lowercasecomponent() {
  'use forget';
  const x = [];
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return <div>{x}</div>;
}
/* eslint-enable react-hooks/rules-of-hooks */

```


## Error

```
Found 2 errors:

Error: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled

React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. Found suppression `eslint-disable react-hooks/rules-of-hooks`

error.invalid-sketchy-code-use-forget.ts:1:0
> 1 | /* eslint-disable react-hooks/rules-of-hooks */
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Found React rule suppression
  2 | function lowercasecomponent() {
  3 |   'use forget';
  4 |   const x = [];

Error: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled

React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. Found suppression `eslint-disable-next-line react-hooks/rules-of-hooks`

error.invalid-sketchy-code-use-forget.ts:5:2
  3 |   'use forget';
  4 |   const x = [];
> 5 |   // eslint-disable-next-line react-hooks/rules-of-hooks
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Found React rule suppression
  6 |   return <div>{x}</div>;
  7 | }
  8 | /* eslint-enable react-hooks/rules-of-hooks */
```
          
      