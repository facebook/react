
## Input

```javascript
function Component(props) {
  let x = cond ? someGlobal : props.foo;
  const mutatePhiThatCouldBeProps = () => {
    x.y = true;
  };
  const indirectMutateProps = () => {
    mutatePhiThatCouldBeProps();
  };
  useEffect(() => indirectMutateProps(), []);
}

```


## Error

```
  2 |   let x = cond ? someGlobal : props.foo;
  3 |   const mutatePhiThatCouldBeProps = () => {
> 4 |     x.y = true;
    |     ^ InvalidReact: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect. Found mutation of `x` (4:4)
  5 |   };
  6 |   const indirectMutateProps = () => {
  7 |     mutatePhiThatCouldBeProps();
```
          
      