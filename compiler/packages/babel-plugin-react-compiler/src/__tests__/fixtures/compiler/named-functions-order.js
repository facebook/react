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
