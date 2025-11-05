
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none"
import React from 'react';

function NonReactiveDepInEffect() {
  const obj = makeObject_Primitives();
  React.useEffect(() => print(obj), React.AUTODEPS);
}

```


## Error

```
Found 1 error:

Error: Cannot infer dependencies of this effect. This will break your build!

To resolve, either pass a dependency array or fix reported compiler bailout diagnostics.

error.todo-import-default-property-useEffect.ts:6:2
  4 | function NonReactiveDepInEffect() {
  5 |   const obj = makeObject_Primitives();
> 6 |   React.useEffect(() => print(obj), React.AUTODEPS);
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Cannot infer dependencies
  7 | }
  8 |
```
          
      