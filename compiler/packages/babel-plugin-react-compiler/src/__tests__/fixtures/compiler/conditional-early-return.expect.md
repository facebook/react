
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
  params: [{ a: 1, b: false, d: 3 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; /**
 * props.b does *not* influence `a`
 */
function ComponentA(props) {
  const $ = _c(3);
  let t0;
  let t1;
  if ($[0] !== props) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const a_DEBUG = [];
      a_DEBUG.push(props.a);
      if (props.b) {
        t1 = null;
        break bb0;
      }

      t0 = a_DEBUG;
      a_DEBUG.push(props.d);
    }
    $[0] = props;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  return t0;
}

/**
 * props.b *does* influence `a`
 */
function ComponentB(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    const a = [];
    a.push(props.a);
    if (props.b) {
      a.push(props.c);
    }

    t0 = a;
    a.push(props.d);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

/**
 * props.b *does* influence `a`, but only in a way that is never observable
 */
function ComponentC(props) {
  const $ = _c(3);
  let t0;
  let t1;
  if ($[0] !== props) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const a = [];
      a.push(props.a);
      if (props.b) {
        a.push(props.c);
        t1 = null;
        break bb0;
      }

      t0 = a;
      a.push(props.d);
    }
    $[0] = props;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  return t0;
}

/**
 * props.b *does* influence `a`
 */
function ComponentD(props) {
  const $ = _c(3);
  let t0;
  let t1;
  if ($[0] !== props) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const a = [];
      a.push(props.a);
      if (props.b) {
        a.push(props.c);
        t1 = a;
        break bb0;
      }

      t0 = a;
      a.push(props.d);
    }
    $[0] = props;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: ComponentA,
  params: [{ a: 1, b: false, d: 3 }],
};

```
      
### Eval output
(kind: ok) [1,3]