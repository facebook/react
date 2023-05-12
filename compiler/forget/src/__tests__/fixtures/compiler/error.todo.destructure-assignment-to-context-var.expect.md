
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
[InferReferenceEffects] Context variables are always mutable.
```
          
      