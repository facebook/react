
## Input

```javascript
// @validateRefAccessDuringRender
function Component() {
  const ref = useRef(null);
  ref.current = false;

  return <button ref={ref} />;
}

```


## Error

```
Found 1 error:

Error: Mutating refs during render is not allowed

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

error.invalid-disallow-mutating-ref-in-render.ts:4:2
  2 | function Component() {
  3 |   const ref = useRef(null);
> 4 |   ref.current = false;
    |   ^^^ Cannot mutate ref during render
  5 |
  6 |   return <button ref={ref} />;
  7 | }

Refs may be mutated during render if initialized with `if (ref.current == null)`
```
          
      