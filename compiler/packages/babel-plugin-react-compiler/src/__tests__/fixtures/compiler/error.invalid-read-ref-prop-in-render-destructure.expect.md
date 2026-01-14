
## Input

```javascript
// @validateRefAccessDuringRender @compilationMode:"infer"
function Component({ref}) {
  const value = ref.current;
  return <div>{value}</div>;
}

```


## Error

```
Found 1 error:

Error: Cannot access ref value during render

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

error.invalid-read-ref-prop-in-render-destructure.ts:4:15
  2 | function Component({ref}) {
  3 |   const value = ref.current;
> 4 |   return <div>{value}</div>;
    |                ^^^^^ Ref value is used during render
  5 | }
  6 |

error.invalid-read-ref-prop-in-render-destructure.ts:3:16
  1 | // @validateRefAccessDuringRender @compilationMode:"infer"
  2 | function Component({ref}) {
> 3 |   const value = ref.current;
    |                 ^^^^^^^^^^^ Ref is initially accessed
  4 |   return <div>{value}</div>;
  5 | }
  6 |
```
          
      