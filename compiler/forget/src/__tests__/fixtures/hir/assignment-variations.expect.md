
## Input

```javascript
function f() {
  let x = 1;
  x = x + 1;
  x += 1;
  x >>>= 1;
}

function g(a) {
  a.b.c = a.b.c + 1;
  a.b.c *= 2;
}

```

## Code

```javascript
function f() {
  const x = 1;
  const x$0 = x + 1;
  const x$1 = x$0 + 1;
  const x$2 = x$1 >>> 1;
}

```
## Code

```javascript
function g(a) {
  a.c.b = a.b.c + 1;
  a.c.b = a.b.c * 2;
}

```
      