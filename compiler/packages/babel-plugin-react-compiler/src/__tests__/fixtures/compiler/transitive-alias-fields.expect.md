
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
  const x = {};

  const y = {};

  x.y = y;
  const p = {};
  p.y = x.y;
  const q = {};
  q.y = p.y;

  mutate(q);
}

```
      