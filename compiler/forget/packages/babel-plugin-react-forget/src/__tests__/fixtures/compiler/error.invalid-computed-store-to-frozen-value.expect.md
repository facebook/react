
## Input

```javascript
function Component(props) {
  const x = makeObject();
  // freeze
  <div>{x}</div>;
  x[0] = true;
  return x;
}

```


## Error

```
[ReactForget] InvalidInput: InferReferenceEffects: inferred mutation of known immutable value. Found mutation of $22 (frozen) (5:5)
```
          
      