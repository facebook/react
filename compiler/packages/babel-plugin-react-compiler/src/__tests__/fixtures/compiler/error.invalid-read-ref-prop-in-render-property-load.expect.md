
## Input

```javascript
// @validateRefAccessDuringRender @compilationMode(infer)
function Component(props) {
  const value = props.ref.current;
  return <div>{value}</div>;
}

```


## Error

```
  2 | function Component(props) {
  3 |   const value = props.ref.current;
> 4 |   return <div>{value}</div>;
    |                ^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value at read $15:TObject<BuiltInRefValue> (4:4)
  5 | }
  6 |
```
          
      