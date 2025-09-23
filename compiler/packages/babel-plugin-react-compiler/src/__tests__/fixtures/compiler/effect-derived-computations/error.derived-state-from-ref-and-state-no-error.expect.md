
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState, useRef} from 'react';

export default function Component({test}) {
  const [local, setLocal] = useState('');

  const myRef = useRef(null);

  useEffect(() => {
    setLocal(myRef.current + test);
  }, [test]);

  return <>{local}</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{test: 'testString'}],
};

```


## Error

```
Found 1 error:

Error: Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

error.derived-state-from-ref-and-state-no-error.ts:10:4
   8 |
   9 |   useEffect(() => {
> 10 |     setLocal(myRef.current + test);
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Values derived from props and state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  11 |   }, [test]);
  12 |
  13 |   return <>{local}</>;
```
          
      