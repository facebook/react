
## Input

```javascript
// @enableEmitFreeze @instrumentForget
function useFoo(props) {
  const __DEV__ = 'conflicting global';
  console.log(__DEV__);
  return foo(props.x);
}

```


## Error

```
  1 | // @enableEmitFreeze @instrumentForget
  2 | function useFoo(props) {
> 3 |   const __DEV__ = 'conflicting global';
    |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Todo: Encountered conflicting global in generated program. Conflict from local binding __DEV__ (3:3)
  4 |   console.log(__DEV__);
  5 |   return foo(props.x);
  6 | }
```
          
      