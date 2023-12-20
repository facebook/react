
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
import { unstable_useMemoCache as useMemoCache } from "react";
/**
 * props.b does *not* influence `a`
 */
function ComponentA(props) {
  const $ = useMemoCache(5);
  let a_DEBUG;
  let t37;
  if ($[0] !== props.a || $[1] !== props.b || $[2] !== props.d) {
    t37 = Symbol.for("react.early_return_sentinel");
    bb7: {
      a_DEBUG = [];
      a_DEBUG.push(props.a);
      if (props.b) {
        t37 = null;
        break bb7;
      }

      a_DEBUG.push(props.d);
    }
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.d;
    $[3] = a_DEBUG;
    $[4] = t37;
  } else {
    a_DEBUG = $[3];
    t37 = $[4];
  }
  if (t37 !== Symbol.for("react.early_return_sentinel")) {
    return t37;
  }
  return a_DEBUG;
}

/**
 * props.b *does* influence `a`
 */
function ComponentB(props) {
  const $ = useMemoCache(2);
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
  const $ = useMemoCache(3);
  let a;
  let t47;
  if ($[0] !== props) {
    t47 = Symbol.for("react.early_return_sentinel");
    bb7: {
      a = [];
      a.push(props.a);
      if (props.b) {
        a.push(props.c);
        t47 = null;
        break bb7;
      }

      a.push(props.d);
    }
    $[0] = props;
    $[1] = a;
    $[2] = t47;
  } else {
    a = $[1];
    t47 = $[2];
  }
  if (t47 !== Symbol.for("react.early_return_sentinel")) {
    return t47;
  }
  return a;
}

/**
 * props.b *does* influence `a`
 */
function ComponentD(props) {
  const $ = useMemoCache(3);
  let a;
  let t47;
  if ($[0] !== props) {
    t47 = Symbol.for("react.early_return_sentinel");
    bb7: {
      a = [];
      a.push(props.a);
      if (props.b) {
        a.push(props.c);
        t47 = a;
        break bb7;
      }

      a.push(props.d);
    }
    $[0] = props;
    $[1] = a;
    $[2] = t47;
  } else {
    a = $[1];
    t47 = $[2];
  }
  if (t47 !== Symbol.for("react.early_return_sentinel")) {
    return t47;
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