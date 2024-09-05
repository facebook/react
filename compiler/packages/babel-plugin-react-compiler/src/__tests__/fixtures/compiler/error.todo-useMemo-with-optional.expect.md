
## Input

```javascript
function Component(props) {
  return (
    useMemo(() => {
      return [props.value];
    }) || []
  );
}

```


## Error

```
  1 | function Component(props) {
  2 |   return (
> 3 |     useMemo(() => {
    |     ^^^^^^^^^^^^^^^
> 4 |       return [props.value];
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 5 |     }) || []
    | ^^^^^^^^^^^^^ Todo: Support labeled statements combined with value blocks (conditional, logical, optional chaining, etc) (3:5)
  6 |   );
  7 | }
  8 |
```
          
      