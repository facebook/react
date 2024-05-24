
## Input

```javascript
function component() {
  let x = {};
  let p = {};
  let q = {};
  let y = {};

  x.y = y;
  p.y = x.y;
  q.y = p.y;

  mutate(q);
}

```

## Code

```javascript
function component() {
  const q = {};

  mutate(q);
  const p = {};
  q.y = p.y;
  const x = {};
  p.y = x.y;
  const y = {};
  x.y = y;
}

```
      