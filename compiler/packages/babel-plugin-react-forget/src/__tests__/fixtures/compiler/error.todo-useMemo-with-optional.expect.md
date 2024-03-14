
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
    | ^^^^^^^^^^^^^ [ReactForget] Invariant: Unexpected value block terminal kind 'label' (3:5)
  6 |   );
  7 | }
  8 |
```
          
      