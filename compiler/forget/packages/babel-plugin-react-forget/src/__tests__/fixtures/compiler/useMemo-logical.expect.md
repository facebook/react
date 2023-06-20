
## Input

```javascript
function Component(props) {
  const x = useMemo(() => props.a && props.b);
  return x;
}

```

## Code

```javascript
function Component(props) {
  const t16 = props.a && props.b;
  const x = t16;
  return x;
}

```
      