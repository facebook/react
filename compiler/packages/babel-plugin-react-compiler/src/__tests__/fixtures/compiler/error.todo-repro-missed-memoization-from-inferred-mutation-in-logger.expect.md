
## Input

```javascript
// @flow @validatePreserveExistingMemoizationGuarantees
import {useFragment} from 'react-relay';
import LogEvent from 'LogEvent';
import {useCallback, useMemo} from 'react';

component Component(id) {
  const items = useFragment();

  const [index, setIndex] = useState(0);

  const logData = useMemo(() => {
    const item = items[index];
    return {
      key: item.key,
    };
  }, [index, items]);

  const setCurrentIndex = useCallback(
    (index: number) => {
      const object = {
        tracking: logData.key,
      };
      // We infer that this may mutate `object`, which in turn aliases
      // data from `logData`, such that `logData` may be mutated.
      LogEvent.log(() => object);
      setIndex(index);
    },
    [index, logData, items]
  );

  if (prevId !== id) {
    setCurrentIndex(0);
  }

  return (
    <Foo
      index={index}
      items={items}
      current={mediaList[index]}
      setCurrentIndex={setCurrentIndex}
    />
  );
}

```


## Error

```
   9 |   const [index, setIndex] = useState(0);
  10 |
> 11 |   const logData = useMemo(() => {
     |                   ^^^^^^^^^^^^^^^
> 12 |     const item = items[index];
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 13 |     return {
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 14 |       key: item.key,
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 15 |     };
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 16 |   }, [index, items]);
     | ^^^^^^^^^^^^^^^^^^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This value was memoized in source but not in compilation output. (11:16)

CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This dependency may be mutated later, which could cause the value to change unexpectedly (28:28)

CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This value was memoized in source but not in compilation output. (19:27)
  17 |
  18 |   const setCurrentIndex = useCallback(
  19 |     (index: number) => {
```
          
      