
## Input

```javascript
function foo(a, b, c) {
  let d, g, n, o;
  [
    d,
    [
      {
        e: { f: g },
      },
    ],
  ] = a;
  ({
    l: {
      m: [[n]],
    },
    o,
  } = b);
}

```

## Code

```javascript
function foo(a, b, c) {
  const d = undefined;
  const g = undefined;
  const n = undefined;
  const o = undefined;
  const d$0 = a[0];
  const g$1 = a[1][0].e.f;
  const n$2 = b.l.m[0][0];
  const o$3 = b.o;
}

```
      