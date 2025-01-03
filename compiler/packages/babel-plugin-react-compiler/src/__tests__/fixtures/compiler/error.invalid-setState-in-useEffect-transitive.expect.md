
## Input

```javascript
// @validateNoSetStateInPassiveEffects
import {useEffect, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  const f = () => {
    setState(s => s + 1);
  };
  const g = () => {
    f();
  };
  useEffect(() => {
    g();
  });
  return state;
}

```


## Error

```
  11 |   };
  12 |   useEffect(() => {
> 13 |     g();
     |     ^ InvalidReact: Calling setState directly within a useEffect causes cascading renders and is not recommended. Consider alternatives to useEffect. (https://react.dev/learn/you-might-not-need-an-effect) (13:13)
  14 |   });
  15 |   return state;
  16 | }
```
          
      