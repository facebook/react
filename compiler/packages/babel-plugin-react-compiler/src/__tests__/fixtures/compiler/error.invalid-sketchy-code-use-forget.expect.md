
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
> 1 | /* eslint-disable react-hooks/rules-of-hooks */
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled. React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. eslint-disable react-hooks/rules-of-hooks (1:1)

InvalidReact: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled. React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. eslint-disable-next-line react-hooks/rules-of-hooks (5:5)
  2 | function lowercasecomponent() {
  3 |   'use forget';
  4 |   const x = [];
```
          
      