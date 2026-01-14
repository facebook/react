
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

Error: Mutating refs during render is not allowed

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

error.invalid-write-ref-prop-in-render.ts:4:2
  2 | function Component(props) {
  3 |   const ref = props.ref;
> 4 |   ref.current = true;
    |   ^^^ Cannot mutate ref during render
  5 |   return <div>{value}</div>;
  6 | }
  7 |

Refs may be mutated during render if initialized with `if (ref.current == null)`
```
          
      