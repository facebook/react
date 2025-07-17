
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  const value = ref.current;
  return value;
}

```


## Error

```
Found 1 error:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-access-ref-during-render.ts:4:16
  2 | function Component(props) {
  3 |   const ref = useRef(null);
> 4 |   const value = ref.current;
    |                 ^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  5 |   return value;
  6 | }
  7 |
```
          
      