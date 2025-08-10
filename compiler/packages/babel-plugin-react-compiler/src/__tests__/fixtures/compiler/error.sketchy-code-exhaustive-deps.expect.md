
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
Found 1 error:

Error: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled

React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. Found suppression `eslint-disable-next-line react-hooks/exhaustive-deps`

error.sketchy-code-exhaustive-deps.ts:6:7
  4 |     () => {
  5 |       item.push(1);
> 6 |     }, // eslint-disable-next-line react-hooks/exhaustive-deps
    |        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Found React rule suppression
  7 |     []
  8 |   );
  9 |
```
          
      