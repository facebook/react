
## Input

```javascript
// @validateNoDynamicallyCreatedComponentsOrHooks
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

Error: Components and hooks cannot be created dynamically

The function `Wrapper` appears to be a React component, but it's defined inside `getInput`. Components and Hooks should always be declared at module scope

error.nested-component-in-normal-function.ts:2:7
   1 | // @validateNoDynamicallyCreatedComponentsOrHooks
>  2 | export function getInput(a) {
     |        ^^^^^^^^^^^^^^^^^^^^^^
>  3 |   const Wrapper = () => {
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
>  4 |     const handleChange = () => {
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
>  5 |       a.onChange();
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
>  6 |     };
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
>  7 |
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
>  8 |     return <input onChange={handleChange} />;
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
>  9 |   };
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
> 10 |
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
> 11 |   return Wrapper;
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
> 12 | }
     | ^^ this function dynamically created a component/hook
  13 |
  14 | export const FIXTURE_ENTRYPOINT = {
  15 |   fn: getInput,

error.nested-component-in-normal-function.ts:3:18
   1 | // @validateNoDynamicallyCreatedComponentsOrHooks
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
     | ^^^^ the component is created here
  10 |
  11 |   return Wrapper;
  12 | }
```
          
      