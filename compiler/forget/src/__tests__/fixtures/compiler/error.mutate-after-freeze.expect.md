
## Input

```javascript
function Component(props) {
  let x = [];

  let _ = <Component x={x} />;

  // x is Frozen at this point
  x.push(props.p2);

  return <div>{_}</div>;
}

```


## Error

```
[ReactForget] InvalidInput: InferReferenceEffects: inferred mutation of known immutable value. Found mutation of $27:TObject<BuiltInArray> (frozen) (7:7)
```
          
      