
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
  let t0;

  mutate(a);
  t0 = undefined;
}

```
      