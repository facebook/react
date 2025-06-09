
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
  2 | function Foo() {
  3 |   const x = () => {
> 4 |     window.href = 'foo';
    |     ^^^^^^ InvalidReact: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect (4:4)
  5 |   };
  6 |   const y = {x};
  7 |   return <Bar y={y} />;
```
          
      