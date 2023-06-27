
## Input

```javascript
function Component(props) {
  const x = makeObject();
  // freeze
  <div>{x}</div>;
  delete x.y;
  return x;
}

```


## Error

```
[ReactForget] InvalidReact: InferReferenceEffects: inferred mutation of known immutable value. Found mutation of $18 (frozen) (5:5)
```
          
      