
## Input

```javascript
// @flow @validateRefAccessDuringRender @validatePreserveExistingMemoizationGuarantees

import {useRef} from 'react';

component Foo(cond: boolean, cond2: boolean) {
  const ref = useRef();

  const s = () => {
    return ref.current;
  };

  if (cond) return [s];
  else if (cond2) return {s};
  else return {s: [s]};
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{cond: false, cond2: false}],
};

```


## Error

```
  10 |   };
  11 |
> 12 |   if (cond) return [s];
     |                     ^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (12:12)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (13:13)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (14:14)
  13 |   else if (cond2) return {s};
  14 |   else return {s: [s]};
  15 | }
```
          
      