
## Input

```javascript
// @validateRefAccessDuringRender
function useHook({value}) {
  const ref = useRef(null);
  // Writing to a ref in render is against the rules:
  ref.current = value;
  // returning a ref is allowed, so this alone doesn't trigger an error:
  return ref;
}

```


## Error

```
Found 1 error:

Error: Mutating refs during render is not allowed

React refs are mutable containers that should only be mutated outside of render, such as in event handlers or effects. Mutating a ref during render can cause bugs because the mutation may not be associated with a particular render. See https://react.dev/reference/react/useRef.

error.invalid-write-but-dont-read-ref-in-render.ts:5:2
  3 |   const ref = useRef(null);
  4 |   // Writing to a ref in render is against the rules:
> 5 |   ref.current = value;
    |   ^^^ Cannot mutate ref during render
  6 |   // returning a ref is allowed, so this alone doesn't trigger an error:
  7 |   return ref;
  8 | }

Refs may be mutated during render if initialized with `if (ref.current == null)`
```
          
      