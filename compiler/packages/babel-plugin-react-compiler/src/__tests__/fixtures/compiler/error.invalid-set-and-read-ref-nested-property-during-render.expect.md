
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

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

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
          
      