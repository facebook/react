
## Input

```javascript
// @enableFire
import {fire, useCallback} from 'react';

function Component({props, bar}) {
  const foo = () => {
    console.log(props);
  };
  fire(foo(props));

  useCallback(() => {
    fire(foo(props));
  }, [foo, props]);

  return null;
}

```


## Error

```
Found 2 errors:

Invariant: Cannot compile `fire`

Cannot use `fire` outside of a useEffect function.

error.invalid-outside-effect.ts:8:2
   6 |     console.log(props);
   7 |   };
>  8 |   fire(foo(props));
     |   ^^^^ Cannot compile `fire`
   9 |
  10 |   useCallback(() => {
  11 |     fire(foo(props));

Invariant: Cannot compile `fire`

Cannot use `fire` outside of a useEffect function.

error.invalid-outside-effect.ts:11:4
   9 |
  10 |   useCallback(() => {
> 11 |     fire(foo(props));
     |     ^^^^ Cannot compile `fire`
  12 |   }, [foo, props]);
  13 |
  14 |   return null;
```
          
      