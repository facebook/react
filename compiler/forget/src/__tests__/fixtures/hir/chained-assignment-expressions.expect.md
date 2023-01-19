
## Input

```javascript
function foo() {
  const x = { x: 0 };
  const y = { z: 0 };
  const z = { z: 0 };
  x.x += y.y *= 1;
  z.z += y.y *= x.x &= 3;
  return z;
}

```

## Code

```javascript
function foo() {
  const x = { x: 0 };
  const y = { z: 0 };
  const z = { z: 0 };
  x.x = x.x + (y.y = y.y * 1);
  z.z = z.z + (y.y = y.y * (x.x = x.x & 3));
  return z;
}

```
      