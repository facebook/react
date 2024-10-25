
## Input

```javascript
function component(a) {
  let z = {a};
  let x = function () {
    let z;
    mutate(z);
  };
  return x;
}

```

## Code

```javascript
function component(a) {
  const x = _temp;
  return x;
}
function _temp() {
  let z_0;
  mutate(z_0);
}

```
      