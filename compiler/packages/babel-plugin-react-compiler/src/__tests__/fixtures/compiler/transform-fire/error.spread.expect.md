
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    fire(...foo);
  });

  return null;
}

```


## Error

```
   7 |   };
   8 |   useEffect(() => {
>  9 |     fire(...foo);
     |     ^^^^^^^^^^^^ InvalidReact: Cannot compile `fire`. fire() can only take in a single call expression as an argument but received a spread argument (9:9)
  10 |   });
  11 |
  12 |   return null;
```
          
      