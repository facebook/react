
## Input

```javascript
function Component(props) {
  for (let i = 0; i < props.count; i++) {
    return;
  }
}

```

## Code

```javascript
function Component(props) {
  for (const i = 0; 0 < props.count; ) {
    return undefined;
  }
  return undefined;
}

```
      