
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
Found 1 error:
Error: Mutating component props or hook arguments is not allowed. Consider using a local variable instead

Found mutation of `props`.

error.invalid-prop-mutation-indirect.ts:3:4
  1 | function Component(props) {
  2 |   const f = () => {
> 3 |     props.value = true;
    |     ^^^^^ Mutating component props or hook arguments is not allowed. Consider using a local variable instead
  4 |   };
  5 |   const g = () => {
  6 |     f();


```
          
      