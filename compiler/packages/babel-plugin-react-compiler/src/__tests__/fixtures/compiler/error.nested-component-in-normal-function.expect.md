
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

The function `Wrapper` appears to be a React component, but it's defined inside `getInput`. Components and Hooks should always be declared at module scope.

error.nested-component-in-normal-function.ts:2:16
  1 | // @validateNoDynamicallyCreatedComponentsOrHooks
> 2 | export function getInput(a) {
    |                 ^^^^^^^^ this function dynamically created a component/hook
  3 |   const Wrapper = () => {
  4 |     const handleChange = () => {
  5 |       a.onChange();

error.nested-component-in-normal-function.ts:3:8
  1 | // @validateNoDynamicallyCreatedComponentsOrHooks
  2 | export function getInput(a) {
> 3 |   const Wrapper = () => {
    |         ^^^^^^^ the component is created here
  4 |     const handleChange = () => {
  5 |       a.onChange();
  6 |     };
```
          
      