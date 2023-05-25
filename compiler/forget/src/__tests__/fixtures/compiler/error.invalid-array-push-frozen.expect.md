
## Input

```javascript
function Component(props) {
  const x = [];
  <div>{x}</div>;
  x.push(props.value);
  return x;
}

```


## Error

```
[ReactForget] InvalidInput: InferReferenceEffects: inferred mutation of known immutable value. Found mutation of $20:TObject<BuiltInArray> (frozen) (4:4)
```
          
      