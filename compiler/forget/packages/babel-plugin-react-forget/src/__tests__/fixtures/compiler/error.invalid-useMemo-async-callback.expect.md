
## Input

```javascript
function component(a, b) {
  let x = useMemo(async () => {
    await a;
  }, []);
  return x;
}

```


## Error

```
[ReactForget] InvalidReact: useMemo callbacks may not be async or generator functions (2:4)
```
          
      