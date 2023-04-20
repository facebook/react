
## Input

```javascript
// @panicOnBailout false
function Bad() {
  var x = 1;
  return <div>{x}</div>;
}

function Good() {
  const x = 1;
  return <div>{x}</div>;
}

```

## Code

```javascript
import * as React from "react"; // @panicOnBailout false
function Bad() {
  var x = 1;
  return <div>{x}</div>;
}

function Good() {
  const $ = React.unstable_useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div>{1}</div>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```

## Error

```
[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration
  1 | // @panicOnBailout false
  2 | function Bad() {
> 3 |   var x = 1;
    |   ^^^^^^^^^^
  4 |   return <div>{x}</div>;
  5 | }
  6 |
```
          
      