
## Input

```javascript
// @validateNoSetStateInPassiveEffects
import {useEffect, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  useEffect(() => {
    setState(s => s + 1);
  });
  return state;
}

```


## Error

```
   5 |   const [state, setState] = useState(0);
   6 |   useEffect(() => {
>  7 |     setState(s => s + 1);
     |     ^^^^^^^^ InvalidReact: Calling setState directly within a useEffect causes cascading renders and is not recommended. Consider alternatives to useEffect. (https://react.dev/learn/you-might-not-need-an-effect) (7:7)
   8 |   });
   9 |   return state;
  10 | }
```
          
      