
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component({bar, baz}) {
  const foo = () => {
    console.log(bar, baz);
  };
  useEffect(() => {
    fire(foo(bar), baz);
  });

  return null;
}

```


## Error

```
Found 1 error:

Invariant: [InferMutationAliasingEffects] Expected value kind to be initialized

<unknown> $43:TFunction<BuiltInFire>():  :TFunction<BuiltInFireFunction>():  :TPoly.

error.invalid-multiple-args.ts:9:4
   7 |   };
   8 |   useEffect(() => {
>  9 |     fire(foo(bar), baz);
     |     ^^^^ this is uninitialized
  10 |   });
  11 |
  12 |   return null;
```
          
      