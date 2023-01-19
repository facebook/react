
## Input

```javascript
/**
 * props.b does *not* influence `a`
 */
function Component(props) {
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
function Component(props) {
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
function Component(props) {
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
function Component(props) {
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
/**
 * props.b does *not* influence `a`
 */
function Component(props) {
  const $ = React.useMemoCache();
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
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  const c_2 = $[2] !== props.c;
  const c_3 = $[3] !== props.d;
  let a;
  if (c_0 || c_1 || c_2 || c_3) {
    a = [];
    a.push(props.a);
    if (props.b) {
      a.push(props.c);
    }

    a.push(props.d);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.c;
    $[3] = props.d;
    $[4] = a;
  } else {
    a = $[4];
  }
  return a;
}

/**
 * props.b *does* influence `a`, but only in a way that is never observable
 */
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  const c_2 = $[2] !== props.c;
  const c_3 = $[3] !== props.d;
  let a;
  if (c_0 || c_1 || c_2 || c_3) {
    a = [];
    a.push(props.a);
    if (props.b) {
      a.push(props.c);
      return null;
    }

    a.push(props.d);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.c;
    $[3] = props.d;
    $[4] = a;
  } else {
    a = $[4];
  }
  return a;
}

/**
 * props.b *does* influence `a`
 */
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  const c_2 = $[2] !== props.c;
  const c_3 = $[3] !== props.d;
  let a;
  if (c_0 || c_1 || c_2 || c_3) {
    a = [];
    a.push(props.a);
    if (props.b) {
      a.push(props.c);
      return a;
    }

    a.push(props.d);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.c;
    $[3] = props.d;
    $[4] = a;
  } else {
    a = $[4];
  }
  return a;
}

```
      