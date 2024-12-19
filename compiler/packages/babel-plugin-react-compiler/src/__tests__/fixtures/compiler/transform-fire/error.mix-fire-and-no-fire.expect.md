
## Input

```javascript
// @enableFire
import {fire} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };
  useEffect(() => {
    function nested() {
      fire(foo(props));
      foo(props);
    }

    nested();
  });

  return null;
}

```


## Error

```
   9 |     function nested() {
  10 |       fire(foo(props));
> 11 |       foo(props);
     |       ^^^ InvalidReact: Cannot compile `fire`. All uses of foo must be either used with a fire() call in this effect or not used with a fire() call at all. foo was used with fire() on line 10:10 in this effect (11:11)
  12 |     }
  13 |
  14 |     nested();
```
          
      