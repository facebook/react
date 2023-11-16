
## Input

```javascript
function Component(props) {
  const [x = true ? 1 : 0] = props.y;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ y: [] }],
};

```

## Code

```javascript
function Component(props) {
  const [t23] = props.y;
  const x = t23 === undefined ? (true ? 1 : 0) : t23;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ y: [] }],
};

```
      
### Eval output
(kind: ok) 1