
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

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity } from "shared-runtime";

const Component = React.forwardRef(Component_withRef);
function Component_withRef(t0, ref) {
  const $ = _c(6);
  const { disableLocalRef } = t0;
  const localRef = useFooRef();
  let t1;
  if ($[0] !== disableLocalRef || $[1] !== localRef || $[2] !== ref) {
    t1 = disableLocalRef ? ref : identity(ref, localRef);
    $[0] = disableLocalRef;
    $[1] = localRef;
    $[2] = ref;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const mergedRef = t1;
  let t2;
  if ($[4] !== mergedRef) {
    t2 = <div ref={mergedRef} />;
    $[4] = mergedRef;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

```
      