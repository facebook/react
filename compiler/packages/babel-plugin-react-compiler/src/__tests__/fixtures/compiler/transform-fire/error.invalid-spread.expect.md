
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    fire(...foo);
  });

  return null;
}

```


## Error

```
Found 1 error:

Invariant: [InferMutationAliasingEffects] Expected value kind to be initialized

<unknown> $32:TFunction<BuiltInFire>():  :TFunction<BuiltInFireFunction>():  :TPoly.

error.invalid-spread.ts:9:4
   7 |   };
   8 |   useEffect(() => {
>  9 |     fire(...foo);
     |     ^^^^ this is uninitialized
  10 |   });
  11 |
  12 |   return null;
```
          
      