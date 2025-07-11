
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

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-disallow-mutating-ref-in-render.ts:4:2
  2 | function Component() {
  3 |   const ref = useRef(null);
> 4 |   ref.current = false;
    |   ^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  5 |
  6 |   return <button ref={ref} />;
  7 | }
```
          
      