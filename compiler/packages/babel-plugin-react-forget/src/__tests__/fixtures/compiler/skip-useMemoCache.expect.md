
## Input

```javascript
function Component(props) {
  const $ = useMemoCache();
  let x;
  if ($[0] === undefined) {
    x = [props.value];
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```

## Code

```javascript
function Component(props) {
  const $ = useMemoCache();
  let x;
  if ($[0] === undefined) {
    x = [props.value];
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      