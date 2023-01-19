
## Input

```javascript
function component() {
  let z = [];
  let y = {};
  y.z = z;
  let x = {};
  x.y = y;
  mutate(x.y.z);
}

```

## Code

```javascript
function component() {
  const z = [];
  const y = {};
  y.z = z;

  const x = {};
  x.y = y;

  mutate(x.y.z);
}

```
      