
## Input

```javascript
function foo() {
  let x = 1;
  if (x === 1) {
    x = 2;
  }

  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
};

```

## Code

```javascript
function foo() {
  return 2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
};

```
      