
## Input

```javascript
/**
 * props.b *does* influence `a`
 */
function Component(props) {
  const a = [];
  a.push(props.a);
  label: {
    if (props.b) {
      break label;
    }
    a.push(props.c);
  }
  a.push(props.d);
  return a;
}

```

## Code

```javascript
function Component(props) {
  const a = [];
  a.push(props.a);
  if (props.b) {
    a.push(props.d);
    return a;
  }

  a.push(props.c);
}

```
      