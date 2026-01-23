
## Input

```javascript
function Component() {
  try {
    return 1;
  } finally {
    console.log('cleanup');
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
function Component() {
  try {
    return 1;
  } finally {
    console.log("cleanup");
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) 1
logs: ['cleanup']