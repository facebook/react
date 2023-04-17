
## Input

```javascript
// @inlineUseMemo
function Component(props) {
  const x = useMemo(() => props.a && props.b);
  return x;
}

```

## Code

```javascript
// @inlineUseMemo
function Component(props) {
  const t14 = props.a && props.b;
  const x = t14;
  return x;
}

```
      