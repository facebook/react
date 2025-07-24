
## Input

```javascript
// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(null);
  const x = foo(ref);
  return x.current;
}

```


## Error

```
Found 1 error:

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-pass-ref-to-function.ts:4:16
  2 | function Component(props) {
  3 |   const ref = useRef(null);
> 4 |   const x = foo(ref);
    |                 ^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  5 |   return x.current;
  6 | }
  7 |
```
          
      