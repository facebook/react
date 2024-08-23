
## Input

```javascript
// @flow @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';
import {useFragment} from 'shared-runtime';

function useData({items}) {
  const data = useMemo(
    () => items?.edges?.nodes.map(item => <Item item={item} />),
    [items?.edges?.nodes]
  );
  return data;
}

```


## Error

```
   5 | function useData({items}) {
   6 |   const data = useMemo(
>  7 |     () => items?.edges?.nodes.map(item => <Item item={item} />),
     |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected (7:7)
   8 |     [items?.edges?.nodes]
   9 |   );
  10 |   return data;
```
          
      