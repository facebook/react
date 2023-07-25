
## Input

```javascript
import * as React from "react";

function Component(props) {
  const [x] = React.useState(0);
  const expensiveNumber = React.useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}

function Component2(props) {
  const [x] = React.useState(0);
  const expensiveNumber = React.useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}

```


## Error

```
[ReactForget] Todo: (BuildHIR::lowerMemberExpression) Handle loading properties from React namespace (4:4)

[ReactForget] Todo: (BuildHIR::lowerMemberExpression) Handle loading properties from React namespace (5:5)
```
          
      