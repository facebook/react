
## Input

```javascript
function foo(props) {
  let x = 0;
  let y = 0;
  while (y < props.max) {
    x++;
    y++;
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
function foo(props) {
  let y = 0;
  while (y < props.max) {
    y++;
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      