
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none"
import React from 'react';

function NonReactiveDepInEffect() {
  const obj = makeObject_Primitives();
  React.useEffect(() => print(obj));
}

```


## Error

```
  4 | function NonReactiveDepInEffect() {
  5 |   const obj = makeObject_Primitives();
> 6 |   React.useEffect(() => print(obj));
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: [InferEffectDependencies] React Compiler is unable to infer dependencies of this effect. This will break your build! To resolve, either pass your own dependency array or fix reported compiler bailout diagnostics. (6:6)
  7 | }
  8 |
```
          
      