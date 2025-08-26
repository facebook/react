
## Input

```javascript
// @validateNoComponentOrHookFactories
export function getInput(a) {
  const Wrapper = () => {
    const handleChange = () => {
      a.onChange();
    };

    return <input onChange={handleChange} />;
  };

  return Wrapper;
}

export const FIXTURE_ENTRYPOINT = {
  fn: getInput,
  isComponent: false,
  params: [{onChange() {}}],
};

```


## Error

```
Found 1 error:

Error: Cannot compile nested component inside a non-React function

The function "Wrapper" appears to be a React component, but it's defined inside "getInput", which is not a React component or hook. The compiler cannot optimize nested React functions when the parent function is not compiled, as this leads to scope reference errors. Either move "Wrapper" to the module level, or ensure the parent function follows React naming conventions (PascalCase for components, "use" prefix for hooks).

error.nested-component-in-normal-function.ts:3:18
   1 | // @validateNoComponentOrHookFactories
   2 | export function getInput(a) {
>  3 |   const Wrapper = () => {
     |                   ^^^^^^^
>  4 |     const handleChange = () => {
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  5 |       a.onChange();
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  6 |     };
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  7 |
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  8 |     return <input onChange={handleChange} />;
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  9 |   };
     | ^^^^ Cannot compile nested component inside a non-React function
  10 |
  11 |   return Wrapper;
  12 | }
```
          
      