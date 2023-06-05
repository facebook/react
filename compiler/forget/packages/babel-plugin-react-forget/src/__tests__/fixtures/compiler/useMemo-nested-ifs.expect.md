
## Input

```javascript
function Component(props) {
  const x = useMemo(() => {
    if (props.cond) {
      if (props.cond) {
      }
    }
  }, [props.cond]);
  return x;
}

```

## Code

```javascript
function Component(props) {
  if (props.cond) {
    if (props.cond) {
    }
  }
}

```
      