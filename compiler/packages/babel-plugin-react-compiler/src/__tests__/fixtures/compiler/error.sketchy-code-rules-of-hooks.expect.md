
## Input

```javascript
/* eslint-disable react-hooks/rules-of-hooks */
function lowercasecomponent() {
  const x = [];
  return <div>{x}</div>;
}
/* eslint-enable react-hooks/rules-of-hooks */

export const FIXTURE_ENTRYPOINT = {
  fn: lowercasecomponent,
  params: [],
  isComponent: false,
};

```


## Error

```
Found 1 error:

Error: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled

React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. Found suppression `eslint-disable react-hooks/rules-of-hooks`

error.sketchy-code-rules-of-hooks.ts:1:0
> 1 | /* eslint-disable react-hooks/rules-of-hooks */
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Found React rule suppression
  2 | function lowercasecomponent() {
  3 |   const x = [];
  4 |   return <div>{x}</div>;
```
          
      