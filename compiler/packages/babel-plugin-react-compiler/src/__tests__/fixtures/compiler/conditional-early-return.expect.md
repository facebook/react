
## Input

```javascript
/**
 * props.b does *not* influence `a`
 */
function ComponentA(props) {
  const a_DEBUG = [];
  a_DEBUG.push(props.a);
  if (props.b) {
    return null;
  }
  a_DEBUG.push(props.d);
  return a_DEBUG;
}

/**
 * props.b *does* influence `a`
 */
function ComponentB(props) {
  const a = [];
  a.push(props.a);
  if (props.b) {
    a.push(props.c);
  }
  a.push(props.d);
  return a;
}

/**
 * props.b *does* influence `a`, but only in a way that is never observable
 */
function ComponentC(props) {
  const a = [];
  a.push(props.a);
  if (props.b) {
    a.push(props.c);
    return null;
  }
  a.push(props.d);
  return a;
}

/**
 * props.b *does* influence `a`
 */
function ComponentD(props) {
  const a = [];
  a.push(props.a);
  if (props.b) {
    a.push(props.c);
    return a;
  }
  a.push(props.d);
  return a;
}

export const FIXTURE_ENTRYPOINT = {
  fn: ComponentA,
  params: [{a: 1, b: false, d: 3}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; /**
 * props.b does *not* influence `a`
 */
function ComponentA(props) {
  const $ = _c(3);
  let a_DEBUG;
  let t0;
  if ($[0] !== props) {
    t0 = Symbol.for("react.early_return_sentinel");
    bb0: {
      a_DEBUG = [];
      a_DEBUG.push(props.a);
      if (props.b) {
        t0 = null;
        break bb0;
      }

      a_DEBUG.push(props.d);
    }
    $[0] = props;
    $[1] = a_DEBUG;
    $[2] = t0;
  } else {
    a_DEBUG = $[1];
    t0 = $[2];
  }
  if (t0 !== Symbol.for("react.early_return_sentinel")) {
    return t0;
  }
  return a_DEBUG;
}

/**
 * props.b *does* influence `a`
 */
function ComponentB(props) {
  const $ = _c(2);
  let a;
  if ($[0] !== props) {
    a = [];
    a.push(props.a);
    if (props.b) {
      a.push(props.c);
    }

    a.push(props.d);
    $[0] = props;
    $[1] = a;
  } else {
    a = $[1];
  }
  return a;
}

/**
 * props.b *does* influence `a`, but only in a way that is never observable
 */
function ComponentC(props) {
  const $ = _c(3);
  let a;
  let t0;
  if ($[0] !== props) {
    t0 = Symbol.for("react.early_return_sentinel");
    bb0: {
      a = [];
      a.push(props.a);
      if (props.b) {
        a.push(props.c);
        t0 = null;
        break bb0;
      }

      a.push(props.d);
    }
    $[0] = props;
    $[1] = a;
    $[2] = t0;
  } else {
    a = $[1];
    t0 = $[2];
  }
  if (t0 !== Symbol.for("react.early_return_sentinel")) {
    return t0;
  }
  return a;
}

/**
 * props.b *does* influence `a`
 */
function ComponentD(props) {
  const $ = _c(3);
  let a;
  let t0;
  if ($[0] !== props) {
    t0 = Symbol.for("react.early_return_sentinel");
    bb0: {
      a = [];
      a.push(props.a);
      if (props.b) {
        a.push(props.c);
        t0 = a;
        break bb0;
      }

      a.push(props.d);
    }
    $[0] = props;
    $[1] = a;
    $[2] = t0;
  } else {
    a = $[1];
    t0 = $[2];
  }
  if (t0 !== Symbol.for("react.early_return_sentinel")) {
    return t0;
  }
  return a;
}

export const FIXTURE_ENTRYPOINT = {
  fn: ComponentA,
  params: [{ a: 1, b: false, d: 3 }],
};

```
      
### Eval output
(kind: ok) [1,3]