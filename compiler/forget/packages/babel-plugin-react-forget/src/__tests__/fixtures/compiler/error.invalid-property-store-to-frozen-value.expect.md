
## Input

```javascript
function Component(props) {
  const x = makeObject();
  // freeze
  <div>{x}</div>;
  x.y = true;
  return x;
}

```


## Error

```
[ReactForget] InvalidReact: InferReferenceEffects: inferred mutation of known immutable value. Found mutation of $20 (frozen) (5:5)
```
          
      