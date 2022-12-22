
## Input

```javascript
function And() {
  return f() && g();
}

function Or() {
  return f() || g();
}

function QuestionQuestion(props) {
  return f() ?? g();
}

function f() {}
function g() {}

```

## Code

```javascript
function And() {
  const $ = React.useMemoCache();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = f();
    $[0] = t0;
  } else {
    t0 = $[0];
  }

  const c_1 = $[1] !== t0;
  let t2;

  if (c_1) {
    t2 = undefined;

    if (t0) {
      let t3;

      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = g();
        $[3] = t3;
      } else {
        t3 = $[3];
      }

      t2 = t3;
    } else {
      t2 = t0;
    }

    $[1] = t0;
    $[2] = t2;
  } else {
    t2 = $[2];
  }

  return t2;
}

```
## Code

```javascript
function Or() {
  const $ = React.useMemoCache();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = f();
    $[0] = t0;
  } else {
    t0 = $[0];
  }

  const c_1 = $[1] !== t0;
  let t2;

  if (c_1) {
    t2 = undefined;

    if (t0) {
      t2 = t0;
    } else {
      let t3;

      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = g();
        $[3] = t3;
      } else {
        t3 = $[3];
      }

      t2 = t3;
    }

    $[1] = t0;
    $[2] = t2;
  } else {
    t2 = $[2];
  }

  return t2;
}

```
## Code

```javascript
function QuestionQuestion(props) {
  const $ = React.useMemoCache();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = f();
    $[0] = t0;
  } else {
    t0 = $[0];
  }

  const c_1 = $[1] !== t0;
  let t2;

  if (c_1) {
    t2 = undefined;

    if (t0 != null) {
      t2 = t0;
    } else {
      let t3;

      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = g();
        $[3] = t3;
      } else {
        t3 = $[3];
      }

      t2 = t3;
    }

    $[1] = t0;
    $[2] = t2;
  } else {
    t2 = $[2];
  }

  return t2;
}

```
## Code

```javascript
function f() {}

```
## Code

```javascript
function g() {}

```
      