
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  useEffect(() => {
    const log = () => {
      console.log(props);
    };
    fire(log)();
  });

  return null;
}

```


## Error

```
   7 |       console.log(props);
   8 |     };
>  9 |     fire(log)();
     |          ^^^ InvalidReact: Cannot compile `fire`. `fire()` only accepts identifiers defined in the component/hook scope. This value was defined in the useEffect callback. (9:9)
  10 |   });
  11 |
  12 |   return null;
```
          
      