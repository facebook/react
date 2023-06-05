
## Input

```javascript
function Component(props) {
  let x = 0;
  props.cond ? (x = 1) : (x = 2);
  return x;
}

```

## Code

```javascript
function Component(props) {
  let x = undefined;

  props.cond ? (x = 1) : (x = 2);
  return x;
}

```
      