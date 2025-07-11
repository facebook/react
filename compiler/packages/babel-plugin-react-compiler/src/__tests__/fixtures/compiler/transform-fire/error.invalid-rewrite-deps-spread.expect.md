
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
Found 1 error:

Invariant: Cannot compile `fire`

You must use an array literal for an effect dependency array when that effect uses `fire()`.

error.invalid-rewrite-deps-spread.ts:15:7
  13 |       fire(foo(props));
  14 |     },
> 15 |     ...deps
     |        ^^^^ Cannot compile `fire`
  16 |   );
  17 |
  18 |   return null;
```
          
      