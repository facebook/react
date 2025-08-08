
## Input

```javascript
// @enableNewMutationAliasingModel:false
function Foo() {
  const x = () => {
    window.href = 'foo';
  };
  const y = {x};
  return <Bar y={y} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```


## Error

```
Found 1 error:

Error: Cannot reassign variables declared outside of the component/hook

Reassigning this value during render is a form of side effect, which can cause unpredictable behavior depending on when the component happens to re-render. If this variable is used in rendering, use useState instead. Otherwise, consider updating it in an effect. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render).

error.object-capture-global-mutation.ts:4:4
  2 | function Foo() {
  3 |   const x = () => {
> 4 |     window.href = 'foo';
    |     ^^^^^^ Cannot reassign variables declared outside of the component/hook
  5 |   };
  6 |   const y = {x};
  7 |   return <Bar y={y} />;
```
          
      