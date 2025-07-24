
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
Found 1 error:

Invariant: Cannot compile `fire`

You must use an array literal for an effect dependency array when that effect uses `fire()`.

error.invalid-rewrite-deps-no-array-literal.ts:13:5
  11 |   useEffect(() => {
  12 |     fire(foo(props));
> 13 |   }, deps);
     |      ^^^^ Cannot compile `fire`
  14 |
  15 |   return null;
  16 | }
```
          
      