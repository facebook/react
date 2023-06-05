
## Input

```javascript
function Component([a = 2]) {
  return a;
}

```

## Code

```javascript
function Component(t14) {
  const [t15] = t14;
  const a = t15 === undefined ? 2 : t15;
  return a;
}

```
      