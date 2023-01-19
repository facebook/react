
## Input

```javascript
function foo() {
  const a = 1;
  const b = 2;
  const c = 3;
  const d = a + b;
  const e = d * c;
  const f = e / d;
  const g = f - e;

  if (g) {
    console.log("foo");
  }

  const h = g;
  const i = h;
  const j = i;
  return j;
}

```

## Code

```javascript
function foo() {
  const a = 1;
  const b = 2;
  const c = 3;
  const d = 3;
  const e = 9;
  const f = 3;
  const g = -6;

  console.log("foo");

  const h = -6;
  const i = -6;
  const j = -6;
  return j;
}

```
      