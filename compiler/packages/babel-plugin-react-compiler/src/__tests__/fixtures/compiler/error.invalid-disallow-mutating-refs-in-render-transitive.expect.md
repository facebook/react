
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
Found 2 errors:

Error: This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-disallow-mutating-refs-in-render-transitive.ts:9:2
   7 |   };
   8 |   const changeRef = setRef;
>  9 |   changeRef();
     |   ^^^^^^^^^ This function accesses a ref value (the `current` property), which may not be accessed during render. (https://react.dev/reference/react/useRef)
  10 |
  11 |   return <button ref={ref} />;
  12 | }

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.invalid-disallow-mutating-refs-in-render-transitive.ts:9:2
   7 |   };
   8 |   const changeRef = setRef;
>  9 |   changeRef();
     |   ^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  10 |
  11 |   return <button ref={ref} />;
  12 | }
```
          
      