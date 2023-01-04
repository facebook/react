
## Input

```javascript
function foo(a, b, c) {
  const [
    d,
    [
      {
        e: { f },
      },
    ],
  ] = a;
  const {
    l: {
      m: [[n]],
    },
    o,
  } = b;
}

```

## Code

```javascript
function foo(a, b, c) {
  const d = a[0];
  const f = a[1][0].e.f;
  const n = b.l.m[0][0];
  const o = b.o;
}

```
      