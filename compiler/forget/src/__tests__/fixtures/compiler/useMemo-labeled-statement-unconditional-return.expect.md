
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
  const t8 = props.value;
  const x = t8;
  return x;
}

```
      