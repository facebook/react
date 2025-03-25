
## Input

```javascript
// @inferEffectDependencies
import {useEffect, useRef} from 'react';
function useCustomRef() {
  const ref = useRef();
  return ref;
}
function NonReactiveWrapper() {
  const ref = useCustomRef();
  useEffect(() => {
    print(ref);
  });
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect, useRef } from "react";
function useCustomRef() {
  const ref = useRef();
  return ref;
}

function NonReactiveWrapper() {
  const $ = _c(2);
  const ref = useCustomRef();
  let t0;
  if ($[0] !== ref) {
    t0 = () => {
      print(ref);
    };
    $[0] = ref;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  useEffect(t0, [ref]);
}

```
      
### Eval output
(kind: exception) Fixture not implemented