
## Input

```javascript
function foo() {
  const a = 1n;
  const b = 2n;
  const c = 3n;
  const d = a + b;
  const e = d * c;
  const f = e / d;
  const g = f - e;

  if (g) {
    console.log('foo');
  }

  const h = g;
  const i = h;
  const j = i;
  return j;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
function foo() {
  const e = 3n * 3n;
  const f = e / 3n;
  const g = f - e;
  if (g) {
    console.log("foo");
  }

  const h = g;
  const i = h;
  const j = i;
  return j;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: exception) Do not know how to serialize a BigInt
logs: ['foo','foo']