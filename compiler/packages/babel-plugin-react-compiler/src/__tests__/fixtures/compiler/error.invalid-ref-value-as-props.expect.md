
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
Found 1 error:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-ref-value-as-props.ts:4:19
  2 | function Component(props) {
  3 |   const ref = useRef(null);
> 4 |   return <Foo ref={ref.current} />;
    |                    ^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  5 | }
  6 |
```
          
      