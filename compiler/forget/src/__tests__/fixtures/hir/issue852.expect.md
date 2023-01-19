
## Input

```javascript
function Component(c) {
  let x = { c };
  mutate(x);
  let a = x;
  let b = a;
}

```

## Code

```javascript
function Component(c) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== c;
  let x;
  if (c_0) {
    x = { c: c };
    mutate(x);
    $[0] = c;
    $[1] = x;
  } else {
    x = $[1];
  }
  const a = x;
  const b = a;
}

```
      