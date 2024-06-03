
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef({ inner: null });
  ref.current.inner = props.value;
  return ref.current.inner;
}

```


## Error

```
  2 | function Component(props) {
  3 |   const ref = useRef({ inner: null });
> 4 |   ref.current.inner = props.value;
    |   ^^^^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be modified during render. (https://react.dev/reference/react/useRef) (4:4)
  5 |   return ref.current.inner;
  6 | }
  7 |
```
          
      