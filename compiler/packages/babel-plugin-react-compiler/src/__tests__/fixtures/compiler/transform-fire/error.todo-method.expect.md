
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    fire(props.foo)();
  });

  return null;
}

```


## Error

```
   7 |   };
   8 |   useEffect(() => {
>  9 |     fire(props.foo)();
     |     ^^^^^^^^^^^^^^^ InvalidReact: Cannot compile `fire`. fire() can only be called with an identifier as an argument, like fire(myFunction)(myArgument) (9:9)
  10 |   });
  11 |
  12 |   return null;
```
          
      