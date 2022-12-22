
## Input

```javascript
function foo() {
  let x = 1;
  let y = 2;

  if (y) {
    let z = x + y;
  }
}

```

## Code

```javascript
function foo() {
  const x = 1;
  const y = 2;
  if (y) {
    const z = x + y;
  }
}

```
      