
## Input

```javascript
// @enableFire
import {fire, useEffect} from 'react';

function Component(props) {
  const foo = props => {
    console.log(props);
  };

  if (props.cond) {
    useEffect(() => {
      fire(foo(props));
    });
  }

  return null;
}

```


## Error

```
   8 |
   9 |   if (props.cond) {
> 10 |     useEffect(() => {
     |     ^^^^^^^^^ InvalidReact: Hooks must always be called in a consistent order, and may not be called conditionally. See the Rules of Hooks (https://react.dev/warnings/invalid-hook-call-warning) (10:10)
  11 |       fire(foo(props));
  12 |     });
  13 |   }
```
          
      