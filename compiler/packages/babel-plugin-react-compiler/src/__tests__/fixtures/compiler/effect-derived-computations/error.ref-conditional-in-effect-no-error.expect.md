
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState, useRef} from 'react';

export default function Component({test}) {
  const [local, setLocal] = useState(0);

  const myRef = useRef(null);

  useEffect(() => {
    if (myRef.current) {
      setLocal(test);
    } else {
      setLocal(test + test);
    }
  }, [test]);

  return <>{local}</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{test: 4}],
};

```


## Error

```
Found 2 errors:

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.ref-conditional-in-effect-no-error.ts:11:6
   9 |   useEffect(() => {
  10 |     if (myRef.current) {
> 11 |       setLocal(test);
     |       ^^^^^^^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  12 |     } else {
  13 |       setLocal(test + test);
  14 |     }

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.ref-conditional-in-effect-no-error.ts:13:6
  11 |       setLocal(test);
  12 |     } else {
> 13 |       setLocal(test + test);
     |       ^^^^^^^^^^^^^^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  14 |     }
  15 |   }, [test]);
  16 |
```
          
      