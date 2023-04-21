
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
  const t15 = props.a && props.b;
  const x = t15;
  return x;
}

```
      