
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };

  const deps = [foo, props];

  useEffect(
    () => {
      fire(foo(props));
    },
    ...deps
  );

  return null;
}

```


## Error

```
  13 |       fire(foo(props));
  14 |     },
> 15 |     ...deps
     |        ^^^^ Invariant: Cannot compile `fire`. You must use an array literal for an effect dependency array when that effect uses `fire()` (15:15)
  16 |   );
  17 |
  18 |   return null;
```
          
      