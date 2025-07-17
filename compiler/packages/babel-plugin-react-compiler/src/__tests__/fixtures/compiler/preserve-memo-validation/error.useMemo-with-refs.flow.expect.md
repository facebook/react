
## Input

```javascript
// @flow @validatePreserveExistingMemoizationGuarantees
import {identity} from 'shared-runtime';

component Component(disableLocalRef, ref) {
  const localRef = useFooRef();
  const mergedRef = useMemo(() => {
    return disableLocalRef ? ref : identity(ref, localRef);
  }, [disableLocalRef, ref, localRef]);
  return <div ref={mergedRef} />;
}

```


## Error

```
Found 1 error:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

   5 |   const localRef = useFooRef();
   6 |   const mergedRef = useMemo(() => {
>  7 |     return disableLocalRef ? ref : identity(ref, localRef);
     |                                             ^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
   8 |   }, [disableLocalRef, ref, localRef]);
   9 |   return <div ref={mergedRef} />;
  10 | }
```
          
      