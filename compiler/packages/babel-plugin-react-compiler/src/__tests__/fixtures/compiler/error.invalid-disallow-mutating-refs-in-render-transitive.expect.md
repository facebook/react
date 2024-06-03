
## Input

```javascript
// @validateRefAccessDuringRender
function Component() {
  const ref = useRef(null);

  const setRef = () => {
    ref.current = false;
  };
  const changeRef = setRef;
  changeRef();

  return <button ref={ref} />;
}

```


## Error

```
  4 |
  5 |   const setRef = () => {
> 6 |     ref.current = false;
    |     ^^^ InvalidReact: Ref values (the `current` property) may not be modified during render. (https://react.dev/reference/react/useRef) (6:6)
  7 |   };
  8 |   const changeRef = setRef;
  9 |   changeRef();
```
          
      