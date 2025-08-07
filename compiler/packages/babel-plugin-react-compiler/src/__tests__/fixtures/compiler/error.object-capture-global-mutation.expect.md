
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

Error: Modifying a variable defined outside a component or hook is not allowed. Consider using an effect

error.object-capture-global-mutation.ts:4:4
  2 | function Foo() {
  3 |   const x = () => {
> 4 |     window.href = 'foo';
    |     ^^^^^^ Modifying a variable defined outside a component or hook is not allowed. Consider using an effect
  5 |   };
  6 |   const y = {x};
  7 |   return <Bar y={y} />;
```
          
      