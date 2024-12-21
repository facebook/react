
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
   7 |   };
   8 |   useEffect(() => {
>  9 |     fire(foo(bar), baz);
     |     ^^^^^^^^^^^^^^^^^^^ InvalidReact: Cannot compile `fire`. fire() can only take in a single call expression as an argument but received multiple arguments (9:9)
  10 |   });
  11 |
  12 |   return null;
```
          
      