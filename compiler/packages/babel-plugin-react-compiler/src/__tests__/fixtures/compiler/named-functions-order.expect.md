```js
// @enableNameAnonymousFunctions

import {useEffect} from 'react';

function Component(props) {
  // This function calls another function that's defined later
  function firstFunction() {
    return secondFunction(); // This calls secondFunction before it's declared
  }
  
  // This function is defined after firstFunction but is called by it
  function secondFunction() {
    return props.message || "Hello from second function";
  }
  
  // Another example with more complex nesting
  function outerFunction() {
    function innerFunction() {
      return thirdFunction(); // Calls thirdFunction before it's declared
    }
    return innerFunction();
  }
  
  function thirdFunction() {
    return props.thirdMessage || "Hello from third function";
  }
  
  useEffect(() => {
    console.log(firstFunction());
    console.log(outerFunction());
  }, [props.message, props.thirdMessage]);
  
  return (
    <div>
      {firstFunction()}
      {outerFunction()}
    </div>
  );
}

export default Component;
```

Expected: The compiler should handle the function ordering correctly and not throw errors when named functions call other named functions defined later in the code. The fix ensures that when a named function calls another named function that's defined later in the same component, the compiler properly handles the dependency ordering.
