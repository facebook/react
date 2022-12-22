
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  let y = [];
  while (c) {
    y.push(b);
    x.push(a);
  }
}

```

## Code

```javascript
function foo(a, b, c) {
  const x = [];
  const y = [];
  while (c) {
    y.push(b);
    x.push(a);
  }
}

```
      