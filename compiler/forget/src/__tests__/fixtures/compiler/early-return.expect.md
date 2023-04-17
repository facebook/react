
## Input

```javascript
function MyApp(props) {
  let res;
  if (props.cond) {
    return;
  } else {
    res = 1;
  }
}

```

## Code

```javascript
function MyApp(props) {
  if (props.cond) {
    return undefined;
  } else {
    return undefined;
  }
}

```
      