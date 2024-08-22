
## Input

```javascript
// @flow @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';
import {useFragment} from 'shared-runtime';

function Component() {
  const data = useFragment();
  const nodes = data.nodes ?? [];
  const flatMap = nodes.flatMap(node => node.items);
  const filtered = flatMap.filter(item => item != null);
  const map = useMemo(() => filtered.map(), [filtered]);
  const index = filtered.findIndex(x => x === null);

  return (
    <div>
      {map}
      {index}
    </div>
  );
}

```


## Error

```
   8 |   const flatMap = nodes.flatMap(node => node.items);
   9 |   const filtered = flatMap.filter(item => item != null);
> 10 |   const map = useMemo(() => filtered.map(), [filtered]);
     |                                              ^^^^^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This dependency may be mutated later, which could cause the value to change unexpectedly (10:10)

CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This value was memoized in source but not in compilation output. (10:10)
  11 |   const index = filtered.findIndex(x => x === null);
  12 |
  13 |   return (
```
          
      