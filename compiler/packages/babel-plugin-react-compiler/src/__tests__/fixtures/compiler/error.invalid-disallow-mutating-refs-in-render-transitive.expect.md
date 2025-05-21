
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
   7 |   };
   8 |   const changeRef = setRef;
>  9 |   changeRef();
     |   ^^^^^^^^^ InvalidReact: This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef) (9:9)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (9:9)
  10 |
  11 |   return <button ref={ref} />;
  12 | }
```
          
      