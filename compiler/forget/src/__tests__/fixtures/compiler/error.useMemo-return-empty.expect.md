
## Input

```javascript
// @inlineUseMemo
function component(a) {
  let x = useMemo(() => {
    mutate(a);
  }, []);
  return x;
}

```


## Error

```
Expected value for identifier `9` to be initialized.
```
          
      