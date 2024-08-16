
## Input

```javascript
import {useRef} from 'react';

const useControllableState = options => {};
function NoopComponent() {}

function Component() {
  'use no forget';
  const ref = useRef(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  ref.current = 'bad';
  return <button ref={ref} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```


## Error

```
   7 |   'use no forget';
   8 |   const ref = useRef(null);
>  9 |   // eslint-disable-next-line react-hooks/rules-of-hooks
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled. React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. eslint-disable-next-line react-hooks/rules-of-hooks (9:9)
  10 |   ref.current = 'bad';
  11 |   return <button ref={ref} />;
  12 | }
```
          
      