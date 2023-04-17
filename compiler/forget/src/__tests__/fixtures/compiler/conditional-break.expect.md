
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
import * as React from "react";
/**
 * props.b does *not* influence `a`
 */
function ComponentA(props) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  const c_2 = $[2] !== props.d;
  let a_DEBUG;
  if (c_0 || c_1 || c_2) {
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
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props;
  let a;
  if (c_0) {
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
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props;
  let a;
  if (c_0) {
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
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props;
  let a;
  if (c_0) {
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
      