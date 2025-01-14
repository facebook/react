
## Input

```javascript
function component(a) {
  let y = function () {
    m(x);
  };

  let x = {a};
  m(x);
  return y;
}

function m(x) {}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [{name: 'Jason'}],
};

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function component(a) {
  const $ = _c(2);
  let y;
  if ($[0] !== a) {
    y = function () {
      m(x);
    };

    let x = { a };
    m(x);
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

function m(x) {}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [{ name: "Jason" }],
};

```
      
### Eval output
(kind: ok) "[[ function params=0 ]]"