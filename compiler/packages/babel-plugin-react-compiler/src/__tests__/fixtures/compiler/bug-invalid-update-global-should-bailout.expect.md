
## Input

```javascript
let renderCount = 0;
function useFoo() {
  renderCount += 1;
  return renderCount;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```

## Code

```javascript
let renderCount = 0;
function useFoo() {
  return renderCount;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```
      