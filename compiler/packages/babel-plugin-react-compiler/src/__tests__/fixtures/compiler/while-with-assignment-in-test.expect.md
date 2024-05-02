
## Input

```javascript
function Component() {
  const queue = [1, 2, 3];
  let value = 0;
  let sum = 0;
  while ((value = queue.pop()) != null) {
    sum += value;
  }
  return sum;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
function Component() {
  const queue = [1, 2, 3];
  let value;
  let sum = 0;
  while ((value = queue.pop()) != null) {
    sum = sum + value;
  }
  return sum;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) 6