
## Input

```javascript
function foo() {
  const x = { y: 0 };
  const y = { z: 0 };
  x.y += y.z *= 1;
}

```

## Code

```javascript
function foo() {
  const x = {
    y: 0,
  };
  const y = {
    z: 0,
  };
  y.z = y.z * 1;
  x.y = x.y + (y.z = y.z * 1);
}

```
      