
## Input

```javascript
function useFoo(props) {
  let x;
  [x] = props;
  const foo = () => {
    x = getX(props);
  };
  foo();
  return { x };
}

```


## Error

```
[ReactForget] Invariant: [InferReferenceEffects] Context variables are always mutable. (5:5)
```
          
      