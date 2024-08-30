
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
  3 |   const ref = useRef(null);
  4 |   // Writing to a ref in render is against the rules:
> 5 |   ref.current = value;
    |   ^^^^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (5:5)
  6 |   // returning a ref is allowed, so this alone doesn't trigger an error:
  7 |   return ref;
  8 | }
```
          
      