
## Input

```javascript
function foo() {
  let x = 100n;
  let y = 0n;
  while (x < 10n) {
    y += 1n;
  }
  return y;
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
  let y = 0n;
  while (false) {
    y = y + 1n;
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: exception) Do not know how to serialize a BigInt