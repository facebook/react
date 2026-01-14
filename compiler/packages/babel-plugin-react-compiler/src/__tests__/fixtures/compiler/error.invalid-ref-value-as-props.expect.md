
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

Error: Cannot access ref value during render

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

error.invalid-ref-value-as-props.ts:4:19
  2 | function Component(props) {
  3 |   const ref = useRef(null);
> 4 |   return <Foo ref={ref.current} />;
    |                    ^^^^^^^^^^^ Ref value is used during render
  5 | }
  6 |
```
          
      