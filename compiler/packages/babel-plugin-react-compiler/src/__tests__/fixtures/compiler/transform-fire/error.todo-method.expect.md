
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

Error: Cannot compile `fire`

`fire()` can only receive a function call such as `fire(fn(a,b)). Method calls and other expressions are not allowed.

error.todo-method.ts:9:4
   7 |   };
   8 |   useEffect(() => {
>  9 |     fire(props.foo());
     |     ^^^^^^^^^^^^^^^^^ Cannot compile `fire`
  10 |   });
  11 |
  12 |   return null;
```
          
      