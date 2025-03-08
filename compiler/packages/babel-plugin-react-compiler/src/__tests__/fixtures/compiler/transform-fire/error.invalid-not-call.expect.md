
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = () => {
    console.log(props);
  };
  useEffect(() => {
    foo(fire(props)); // Can't be used as a function argument
    const stored = fire(foo); // Cannot be assigned
    fire(props); // Invalid as an expression statement
  });

  return null;
}

```


## Error

```
   7 |   };
   8 |   useEffect(() => {
>  9 |     foo(fire(props)); // Can't be used as a function argument
     |         ^^^^^^^^^^^ InvalidReact: Cannot compile `fire`. `fire()` expressions can only be called, like fire(myFunction)(myArguments) (9:9)

InvalidReact: Cannot compile `fire`. `fire()` expressions can only be called, like fire(myFunction)(myArguments) (10:10)

InvalidReact: Cannot compile `fire`. `fire(myFunction)` will not do anything on its own, you need to call the result like `fire(myFunction)(myArgument)` (11:11)
  10 |     const stored = fire(foo); // Cannot be assigned
  11 |     fire(props); // Invalid as an expression statement
  12 |   });
```
          
      