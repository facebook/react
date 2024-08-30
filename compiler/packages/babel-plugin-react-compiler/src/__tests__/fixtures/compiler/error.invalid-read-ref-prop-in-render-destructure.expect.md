
## Input

```javascript
// @validateRefAccessDuringRender @compilationMode(infer)
function Component({ref}) {
  const value = ref.current;
  return <div>{value}</div>;
}

```


## Error

```
  1 | // @validateRefAccessDuringRender @compilationMode(infer)
  2 | function Component({ref}) {
> 3 |   const value = ref.current;
    |                 ^^^^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (3:3)
  4 |   return <div>{value}</div>;
  5 | }
  6 |
```
          
      