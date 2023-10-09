
## Input

```javascript
function component(a) {
  let x = useMemo(() => {
    mutate(a);
  }, []);
  return x;
}

```

## Code

```javascript
function component(a) {
  let t23;

  mutate(a);
  t23 = undefined;
  const x = t23;
  return x;
}

```
      