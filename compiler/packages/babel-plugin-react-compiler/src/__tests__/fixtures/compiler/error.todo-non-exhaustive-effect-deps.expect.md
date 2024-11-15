
## Input

```javascript
import {logValue} from 'shared-runtime';

function Component({a}) {
  useEffect(() => {
    logValue(a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0}],
  sequentialRenders: [{a: 1}],
};

```


## Error

```
  4 |   useEffect(() => {
  5 |     logValue(a);
> 6 |     // eslint-disable-next-line react-hooks/exhaustive-deps
    |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled. React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. eslint-disable-next-line react-hooks/exhaustive-deps (6:6)
  7 |   }, []);
  8 |   return null;
  9 | }
```
          
      