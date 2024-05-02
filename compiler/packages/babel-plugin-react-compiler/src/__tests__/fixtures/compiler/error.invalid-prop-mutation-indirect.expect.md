
## Input

```javascript
function Component(props) {
  const f = () => {
    props.value = true;
  };
  const g = () => {
    f();
  };
  g();
}

```


## Error

```
  1 | function Component(props) {
  2 |   const f = () => {
> 3 |     props.value = true;
    |     ^^^^^ InvalidReact: Mutating component props or hook arguments is not allowed. Consider using a local variable instead. Found mutation of `props` (3:3)
  4 |   };
  5 |   const g = () => {
  6 |     f();
```
          
      