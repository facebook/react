
## Input

```javascript
// @eslintSuppressionRules(my-app/react-rule)

/* eslint-disable my-app/react-rule */
function lowercasecomponent() {
  "use forget";
  const x = [];
  // eslint-disable-next-line my-app/react-rule
  return <div>{x}</div>;
}
/* eslint-enable my-app/react-rule */

```


## Error

```
[ReactForget] InvalidReact: React Forget has bailed out of optimizing this component as one or more React eslint rules were disabled. React Forget only works when your components follow all the rules of React, disabling them may result in undefined behavior. eslint-disable my-app/react-rule (3:3)

[ReactForget] InvalidReact: React Forget has bailed out of optimizing this component as one or more React eslint rules were disabled. React Forget only works when your components follow all the rules of React, disabling them may result in undefined behavior. eslint-disable-next-line my-app/react-rule (7:7)
```
          
      