
## Input

```javascript
// Should print A, arg, original

function changeF(o) {
  o.f = () => console.log("new");
}

function Component() {
  let x = {
    f: () => console.log("original"),
  };

  (console.log("A"), x).f((changeF(x), console.log("arg"), 1));
  return x;
}

```

## Code

```javascript
// Should print A, arg, original

function changeF(o) {
  o.f = () => console.log("new");
}

function Component() {
  const $ = React.unstable_useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = { f: () => console.log("original") };

    console.log("A");
    changeF(x);
    console.log("arg");
    x.f(1);
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      