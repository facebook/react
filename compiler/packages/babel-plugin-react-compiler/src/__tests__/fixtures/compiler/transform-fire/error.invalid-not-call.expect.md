
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    fire(props);
  });

  return null;
}

```


## Error

```
   7 |   };
   8 |   useEffect(() => {
>  9 |     fire(props);
     |     ^^^^^^^^^^^ InvalidReact: Cannot compile `fire`. `fire()` can only receive a function call such as `fire(fn(a,b)). Method calls and other expressions are not allowed (9:9)
  10 |   });
  11 |
  12 |   return null;
```
          
      