
## Input

```javascript
// @enableEmitFreeze @instrumentForget

let makeReadOnly = 'conflicting identifier';
function useFoo(props) {
  return foo(props.x);
}

```


## Error

```
Invariant: Encountered conflicting import specifiers for makeReadOnly in generated program.
```
          
      