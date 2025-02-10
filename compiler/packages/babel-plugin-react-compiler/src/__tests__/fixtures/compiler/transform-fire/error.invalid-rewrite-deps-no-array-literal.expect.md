
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };

  const deps = [foo, props];

  useEffect(() => {
    fire(foo(props));
  }, deps);

  return null;
}

```


## Error

```
  11 |   useEffect(() => {
  12 |     fire(foo(props));
> 13 |   }, deps);
     |      ^^^^ Invariant: Cannot compile `fire`. You must use an array literal for an effect dependency array when that effect uses `fire()` (13:13)
  14 |
  15 |   return null;
  16 | }
```
          
      