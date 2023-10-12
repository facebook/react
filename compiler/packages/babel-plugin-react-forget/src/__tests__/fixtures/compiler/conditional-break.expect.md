
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

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
/**
 * props.b does *not* influence `a`
 */
function ComponentA(props) {
  const $ = useMemoCache(4);
  let a_DEBUG;
  if ($[0] !== props.a || $[1] !== props.b || $[2] !== props.d) {
    a_DEBUG = [];
    a_DEBUG.push(props.a);
    if (props.b) {
      return null;
    }

    a_DEBUG.push(props.d);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.d;
    $[3] = a_DEBUG;
  } else {
    a_DEBUG = $[3];
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
  const $ = useMemoCache(2);
  let a;
  if ($[0] !== props) {
    a = [];
    a.push(props.a);
    if (props.b) {
      a.push(props.c);
      return null;
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
 * props.b *does* influence `a`
 */
function ComponentD(props) {
  const $ = useMemoCache(2);
  let a;
  if ($[0] !== props) {
    a = [];
    a.push(props.a);
    if (props.b) {
      a.push(props.c);
      return a;
    }

    a.push(props.d);
    $[0] = props;
    $[1] = a;
  } else {
    a = $[1];
  }
  return a;
}

```
      