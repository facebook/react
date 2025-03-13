
## Input

```javascript
// @inferEffectDependencies @panicThreshold(none)
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
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: [InferEffectDependencies] Untransformed reference to compiler-required feature. Either remove this call or ensure it is successfully transformed by the compiler (6:6)
  7 | }
  8 |
```
          
      