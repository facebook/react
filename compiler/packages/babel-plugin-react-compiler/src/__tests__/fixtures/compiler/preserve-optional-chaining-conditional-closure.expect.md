
## Input

```javascript
// Test that optional chaining is preserved when used inside a closure
// that is only conditionally called. The compiler should NOT strip the ?. 
// operator even if the variable is accessed non-optionally inside a nested function,
// because that function might only be called conditionally.
//
// Before fix (BROKEN): Compiler removes ?. and causes: TypeError: Cannot read properties of undefined
// After fix (CORRECT): Compiler preserves ?. and code is safe

import {useEffect} from 'react';

function Component({devices}) {
  useEffect(() => {
    const currentDevice = devices?.[0];
    
    // The function uses optional chaining, but the compiler was incorrectly
    // inferring it's always non-null because it's called in a guarded context
    const log = () => {
      console.log(currentDevice?.type);
      console.log(currentDevice?.os);
      const match = currentDevice?.os?.match(/android|ios/i);
      console.log(match);
    };
    
    // The function is only called conditionally (if currentDevice is truthy)
    // This should NOT cause the compiler to assume currentDevice is non-null
    // in the component render or effect setup
    if (currentDevice) {
      log();
    }
  }, [devices]);

  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{devices: []}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // Test that optional chaining is preserved when used inside a closure
// that is only conditionally called. The compiler should NOT strip the ?.
// operator even if the variable is accessed non-optionally inside a nested function,
// because that function might only be called conditionally.
//
// Before fix (BROKEN): Compiler removes ?. and causes: TypeError: Cannot read properties of undefined
// After fix (CORRECT): Compiler preserves ?. and code is safe

import { useEffect } from "react";

function Component(t0) {
  const $ = _c(4);
  const { devices } = t0;
  let t1;
  if ($[0] !== devices?.[0]) {
    t1 = () => {
      const currentDevice = devices?.[0];

      const log = () => {
        console.log(currentDevice?.type);
        console.log(currentDevice?.os);
        const match = currentDevice?.os?.match(/android|ios/i);
        console.log(match);
      };

      if (currentDevice) {
        log();
      }
    };
    $[0] = devices?.[0];
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== devices) {
    t2 = [devices];
    $[2] = devices;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  useEffect(t1, t2);

  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ devices: [] }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) null