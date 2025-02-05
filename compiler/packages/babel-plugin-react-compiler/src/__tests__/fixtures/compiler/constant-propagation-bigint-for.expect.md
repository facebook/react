
## Input

```javascript
function foo() {
  let y = 0n;
  for (const x = 100n; x < 10n; x) {
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

## Code

```javascript
function foo() {
  let y = 0n;
  for (const x = 100n; false; 100n) {
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