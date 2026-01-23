
## Input

```javascript
function Component() {
  let x;
  try {
    x = 1;
  } finally {
    console.log('cleanup');
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
function Component() {
  let x;
  try {
    x = 1;
  } finally {
    console.log("cleanup");
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) 1
logs: ['cleanup']