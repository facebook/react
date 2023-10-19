
## Input

```javascript
function f() {
  let x = 1;
  x = x + 1;
  x += 1;
  x >>>= 1;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: f,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
function f() {
  let x;

  x = 3 >>> 1;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: f,
  params: [],
  isComponent: false,
};

```
      