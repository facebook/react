
## Input

```javascript
function component() {
  let x = 1;
  let y = 2;

  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
};

```

## Code

```javascript
function component() {
  return 2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
};

```
      