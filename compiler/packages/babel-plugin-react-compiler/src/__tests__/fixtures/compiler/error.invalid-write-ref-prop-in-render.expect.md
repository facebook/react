
## Input

```javascript
// @validateRefAccessDuringRender @compilationMode:"infer"
function Component(props) {
  const ref = props.ref;
  ref.current = true;
  return <div>{value}</div>;
}

```


## Error

```
Found 1 error:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-write-ref-prop-in-render.ts:4:2
  2 | function Component(props) {
  3 |   const ref = props.ref;
> 4 |   ref.current = true;
    |   ^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  5 |   return <div>{value}</div>;
  6 | }
  7 |
```
          
      