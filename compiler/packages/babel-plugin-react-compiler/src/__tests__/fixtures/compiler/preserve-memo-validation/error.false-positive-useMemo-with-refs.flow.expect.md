
## Input

```javascript
// @flow @validatePreserveExistingMemoizationGuarantees
import { identity } from "shared-runtime";

component Component(
  disableLocalRef,
  ref,
) {
  const localRef = useFooRef();
  const mergedRef = useMemo(() => {
    return disableLocalRef ? ref : identity(ref, localRef);
  }, [disableLocalRef, ref, localRef]);
  return <div ref={mergedRef} />;
}

```


## Error

```
   7 | ) {
   8 |   const localRef = useFooRef();
>  9 |   const mergedRef = useMemo(() => {
     |                             ^^^^^^^
> 10 |     return disableLocalRef ? ref : identity(ref, localRef);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 11 |   }, [disableLocalRef, ref, localRef]);
     | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This value may be mutated later, which could cause the value to change unexpectedly (9:11)
  12 |   return <div ref={mergedRef} />;
  13 | }
  14 |
```
          
      