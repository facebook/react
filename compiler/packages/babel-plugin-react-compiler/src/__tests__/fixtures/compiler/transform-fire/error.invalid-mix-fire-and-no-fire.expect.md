
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };
  useEffect(() => {
    function nested() {
      fire(foo(props));
      foo(props);
    }

    nested();
  });

  return null;
}

```


## Error

```
Found 1 error:

Invariant: [InferMutationAliasingEffects] Expected value kind to be initialized

<unknown> foo$42:TFunction<BuiltInFunction>():  :TPrimitive.

error.invalid-mix-fire-and-no-fire.ts:11:6
   9 |     function nested() {
  10 |       fire(foo(props));
> 11 |       foo(props);
     |       ^^^ this is uninitialized
  12 |     }
  13 |
  14 |     nested();
```
          
      