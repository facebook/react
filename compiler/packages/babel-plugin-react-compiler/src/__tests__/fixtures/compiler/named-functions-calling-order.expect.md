```js
// @enableNameAnonymousFunctions

function Component(props) {
  // This function calls another function that's defined later
  function firstFunction() {
    return secondFunction(); // This calls secondFunction before it's declared
  }
  
  // This function is defined after firstFunction but is called by it
  function secondFunction() {
    return props.message || "Hello from second function";
  }
  
  return firstFunction();
}

export const TODO_FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      message: 'Hello from props',
      thirdMessage: 'Hello from third props',
    },
  ],
};
```

Expected: The compiler should handle the function ordering correctly and not throw errors when named functions call other named functions defined later in the code.
