
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

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-read-ref-prop-in-render-destructure.ts:3:16
  1 | // @validateRefAccessDuringRender @compilationMode:"infer"
  2 | function Component({ref}) {
> 3 |   const value = ref.current;
    |                 ^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  4 |   return <div>{value}</div>;
  5 | }
  6 |
```
          
      