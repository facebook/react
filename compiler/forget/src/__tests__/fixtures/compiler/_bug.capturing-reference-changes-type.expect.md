
## Input

```javascript
function component(a) {
  let x = { a };
  let y = 1;
  (function () {
    y = x;
  })();
  mutate(y);
  return y;
}

```

## Code

```javascript
function component(a) {
  const x = { a };

  (function () {
    y = x;
  })();

  mutate(1);
  return 1;
}

```
      