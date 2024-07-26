
## Input

```javascript
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
  1 | function Foo() {
  2 |   const x = () => {
> 3 |     window.href = 'foo';
    |     ^^^^^^ InvalidReact: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect (3:3)
  4 |   };
  5 |   const y = {x};
  6 |   return <Bar y={y} />;
```
          
      