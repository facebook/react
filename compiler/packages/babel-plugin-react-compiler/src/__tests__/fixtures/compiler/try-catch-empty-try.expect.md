
## Input

```javascript
function Component(props) {
  let x = props.default;
  try {
  } catch (e) {
    x = e;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{default: 42}],
};

```

## Code

```javascript
function Component(props) {
  let x = props.default;
  try {
  } catch (t0) {
    const e = t0;
    x = e;
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ default: 42 }],
};

```
      
### Eval output
(kind: ok) 42