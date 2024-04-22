
## Input

```javascript
function Component(props) {
  const mutateProps = () => {
    props.value = true;
  };
  const indirectMutateProps = () => {
    mutateProps();
  };
  useEffect(() => indirectMutateProps(), []);
}

```


## Error

```
  1 | function Component(props) {
  2 |   const mutateProps = () => {
> 3 |     props.value = true;
    |     ^^^^^ InvalidReact: Mutating props or hook arguments is not allowed. Consider using a local variable instead.. Found mutation of [object Object] (3:3)
  4 |   };
  5 |   const indirectMutateProps = () => {
  6 |     mutateProps();
```
          
      