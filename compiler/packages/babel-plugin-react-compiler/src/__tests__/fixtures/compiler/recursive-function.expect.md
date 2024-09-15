
## Input

```javascript
function foo(x) {
  if (x <= 0) {
    return 0;
  }
  return x + foo(x - 1) + (() => foo(x - 2))();
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [10],
};

```

## Code

```javascript
function foo(x) {
  if (x <= 0) {
    return 0;
  }
  let t0;
  t0 = foo(x - 2);
  return x + foo(x - 1) + t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [10],
};

```
      
### Eval output
(kind: ok) 364