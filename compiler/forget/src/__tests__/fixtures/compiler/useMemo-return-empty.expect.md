
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

## Code

```javascript
// @inlineUseMemo
function component(a) {
  mutate(a);
  return undefined;
}

```
      