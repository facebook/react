
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef({inner: null});
  ref.current.inner = props.value;
  return ref.current.inner;
}

```


## Error

```
Found 1 error:

Error: Cannot access ref value during render

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

error.invalid-set-and-read-ref-nested-property-during-render.ts:5:9
  3 |   const ref = useRef({inner: null});
  4 |   ref.current.inner = props.value;
> 5 |   return ref.current.inner;
    |          ^^^^^^^^^^^^^^^^^ Ref value is used during render
  6 | }
  7 |

error.invalid-set-and-read-ref-nested-property-during-render.ts:5:9
  3 |   const ref = useRef({inner: null});
  4 |   ref.current.inner = props.value;
> 5 |   return ref.current.inner;
    |          ^^^^^^^^^^^ Ref is initially accessed
  6 | }
  7 |
```
          
      