
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
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Todo: Untransformed reference to experimental compiler-only feature (6:6)
  7 | }
  8 |
```
          
      