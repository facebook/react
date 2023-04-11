
## Input

```javascript
// @inlineUseMemo
function component(a, b) {
  let x = useMemo(async () => {
    await a;
  }, []);
  return x;
}

```


## Error

```
[ReactForget] Invariant: Did not expect useMemo callback to be async or a generator (3:5)
```
          
      