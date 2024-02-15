
## Input

```javascript
function Component() {
  const item = [];
  const foo = useCallback(
    () => {
      item.push(1);
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return <Button foo={foo} />;
}

```


## Error

```
  4 |     () => {
  5 |       item.push(1);
> 6 |     }, // eslint-disable-next-line react-hooks/exhaustive-deps
    |        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ [ReactForget] InvalidReact: React Forget has bailed out of optimizing this component as one or more React eslint rules were disabled. React Forget only works when your components follow all the rules of React, disabling them may result in undefined behavior. eslint-disable-next-line react-hooks/exhaustive-deps (6:6)
  7 |     []
  8 |   );
  9 |
```
          
      