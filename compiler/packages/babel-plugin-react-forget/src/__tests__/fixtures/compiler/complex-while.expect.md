
## Input

```javascript
function foo(a, b, c) {
  label: if (a) {
    while (b) {
      if (c) {
        break label;
      }
    }
  }
  return c;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
function foo(a, b, c) {
  bb1: if (a) {
    while (b) {
      if (c) {
        break bb1;
      }
    }
  }
  return c;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      