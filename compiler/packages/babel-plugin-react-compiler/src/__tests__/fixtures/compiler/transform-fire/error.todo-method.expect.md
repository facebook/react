
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    fire(props.foo());
  });

  return null;
}

```


## Error

```
Found 1 error:

Invariant: [InferMutationAliasingEffects] Expected value kind to be initialized

<unknown> $34:TFunction<BuiltInFire>():  :TFunction<BuiltInFireFunction>():  :TPoly.

error.todo-method.ts:9:4
   7 |   };
   8 |   useEffect(() => {
>  9 |     fire(props.foo());
     |     ^^^^ this is uninitialized
  10 |   });
  11 |
  12 |   return null;
```
          
      