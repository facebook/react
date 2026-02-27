
## Input

```javascript
// @noEmit
import {useEffect} from 'react';
import {useKnownIncompatible} from 'ReactCompilerKnownIncompatibleTest';

function MyHook() {
  const data = useKnownIncompatible();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return data;
}

export const FIXTURE_ENTRYPOINT = {
  fn: MyHook,
  params: [],
};

```


## Error

```
Found 1 error:

Compilation Skipped: Use of incompatible library

This API returns functions which cannot be memoized without leading to stale UI. To prevent this, by default React Compiler will skip memoizing this component/hook. However, you may see issues if values from this API are passed to other components/hooks that are memoized.

error.eslint-mode-detects-incompatible-library-with-suppression.ts:6:15
  4 |
  5 | function MyHook() {
> 6 |   const data = useKnownIncompatible();
    |                ^^^^^^^^^^^^^^^^^^^^ useKnownIncompatible is known to be incompatible
  7 |
  8 |   useEffect(() => {
  9 |     // eslint-disable-next-line react-hooks/exhaustive-deps
```
          
      