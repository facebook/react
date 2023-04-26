
## Input

```javascript
function Component(props) {
  let x = 0;
  (x = 1) && (x = 2);
  return x;
}

```

## Code

```javascript
function Component(props) {
  let x = undefined;

  ((x = 1), 1) && (x = 2);
  return x;
}

```
      