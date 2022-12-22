
## Input

```javascript
function Component() {
  const a = [];
  useFreeze(a); // should freeze
  useFreeze(a); // should be readonly
  call(a); // should be readonly
  return a;
}

function useFreeze(x) {}
function call(x) {}

```

## Code

```javascript
function Component() {
  const $ = React.useMemoCache();
  let a;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    $[0] = a;
  } else {
    a = $[0];
  }

  useFreeze(a);
  useFreeze(a);
  call(a);
  return a;
}

```
## Code

```javascript
function useFreeze(x) {}

```
## Code

```javascript
function call(x) {}

```
      