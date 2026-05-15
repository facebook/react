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
