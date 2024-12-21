
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
   6 |     console.log(props);
   7 |   };
>  8 |   fire(foo(props));
     |   ^^^^ Invariant: Cannot compile `fire`. Cannot use `fire` outside of a useEffect function (8:8)

Invariant: Cannot compile `fire`. Cannot use `fire` outside of a useEffect function (11:11)
   9 |
  10 |   useCallback(() => {
  11 |     fire(foo(props));
```
          
      