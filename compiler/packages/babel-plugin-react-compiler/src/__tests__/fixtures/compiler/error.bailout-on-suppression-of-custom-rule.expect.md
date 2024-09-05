
## Input

```javascript
// @eslintSuppressionRules(my-app/react-rule)

/* eslint-disable my-app/react-rule */
function lowercasecomponent() {
  'use forget';
  const x = [];
  // eslint-disable-next-line my-app/react-rule
  return <div>{x}</div>;
}
/* eslint-enable my-app/react-rule */

```


## Error

```
  1 | // @eslintSuppressionRules(my-app/react-rule)
  2 |
> 3 | /* eslint-disable my-app/react-rule */
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled. React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. eslint-disable my-app/react-rule (3:3)

InvalidReact: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled. React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. eslint-disable-next-line my-app/react-rule (7:7)
  4 | function lowercasecomponent() {
  5 |   'use forget';
  6 |   const x = [];
```
          
      