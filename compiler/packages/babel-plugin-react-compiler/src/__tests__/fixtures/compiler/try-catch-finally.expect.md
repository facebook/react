
## Input

```javascript
function Component(props) {
  try {
    if (props.cond) {
      return 1;
    }
    return 2;
  } catch (e) {
    return 3;
  } finally {
    console.log('cleanup');
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{cond: true}],
  sequentialRenders: [
    {cond: true},
    {cond: false},
  ],
};

```

## Code

```javascript
function Component(props) {
  try {
    if (props.cond) {
      return 1;
    }
    return 2;
  } catch (t0) {
    return 3;
  } finally {
    console.log("cleanup");
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true }],
  sequentialRenders: [{ cond: true }, { cond: false }],
};

```
      
### Eval output
(kind: ok) 1
2
logs: ['cleanup','cleanup']