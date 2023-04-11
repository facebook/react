
## Input

```javascript
// @inlineUseMemo
function Component(props) {
  const x = useMemo(() => {
    label: {
      return props.value;
    }
  });
  return x;
}

```

## Code

```javascript
// @inlineUseMemo
function Component(props) {
  const t19 = props.value;
  const x = t19;
  return x;
}

```
      