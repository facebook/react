
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
function foo(a, b, c) {}

```
      