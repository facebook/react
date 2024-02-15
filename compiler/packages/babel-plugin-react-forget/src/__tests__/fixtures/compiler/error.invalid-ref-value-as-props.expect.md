
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  return <Foo ref={ref.current} />;
}

```


## Error

```
  2 | function Component(props) {
  3 |   const ref = useRef(null);
> 4 |   return <Foo ref={ref.current} />;
    |                    ^^^^^^^^^^^ [ReactForget] InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value at freeze $19:TObject<BuiltInRefValue> (4:4)
  5 | }
  6 |
```
          
      