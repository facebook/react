
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

/**
 * props.b *does* influence `a`
 */
function Component(props) {
  const a = [];
  a.push(props.a);
  label: {
    if (props.b) {
      break label;
    }
    a.push(props.c);
  }
  a.push(props.d);
  return a;
}

```

## HIR

```
bb0:
  [1] Const mutate a_DEBUG$5_@0[1:7] = Array []
  [2] Call mutate a_DEBUG$5_@0.push(read props$4.a)
  [3] If (read props$4.b) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Const mutate $6:TPrimitive = null
  [5] Return read $6:TPrimitive
bb1:
  predecessor blocks: bb0
  [6] Call mutate a_DEBUG$5_@0.push(read props$4.d)
  [7] Return freeze a_DEBUG$5_@0
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:7] deps=[read props$4.a, read props$4.b, read props$4.d] out=[a_DEBUG$5_@0] {
    [1] Const mutate a_DEBUG$5_@0[1:7] = Array []
    [2] Call mutate a_DEBUG$5_@0.push(read props$4.a)
    if (read props$4.b) {
      [4] Const mutate $6:TPrimitive = null
      return read $6:TPrimitive
    }
    [6] Call mutate a_DEBUG$5_@0.push(read props$4.d)
  }
  return freeze a_DEBUG$5_@0
}

```

## Code

```javascript
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

```
## HIR

```
bb0:
  [1] Const mutate a$4_@0[1:7] = Array []
  [2] Call mutate a$4_@0.push(read props$3.a)
  [3] If (read props$3.b) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Call mutate a$4_@0.push(read props$3.c)
  [5] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [6] Call mutate a$4_@0.push(read props$3.d)
  [7] Return freeze a$4_@0
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:7] deps=[read props$3.a, read props$3.b, read props$3.c, read props$3.d] out=[a$4_@0] {
    [1] Const mutate a$4_@0[1:7] = Array []
    [2] Call mutate a$4_@0.push(read props$3.a)
    if (read props$3.b) {
      [4] Call mutate a$4_@0.push(read props$3.c)
    }
    [6] Call mutate a$4_@0.push(read props$3.d)
  }
  return freeze a$4_@0
}

```

## Code

```javascript
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

```
## HIR

```
bb0:
  [1] Const mutate a$5_@0[1:8] = Array []
  [2] Call mutate a$5_@0.push(read props$4.a)
  [3] If (read props$4.b) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Call mutate a$5_@0.push(read props$4.c)
  [5] Const mutate $6:TPrimitive = null
  [6] Return read $6:TPrimitive
bb1:
  predecessor blocks: bb0
  [7] Call mutate a$5_@0.push(read props$4.d)
  [8] Return freeze a$5_@0
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:8] deps=[read props$4.a, read props$4.b, read props$4.c, read props$4.d] out=[a$5_@0] {
    [1] Const mutate a$5_@0[1:8] = Array []
    [2] Call mutate a$5_@0.push(read props$4.a)
    if (read props$4.b) {
      [4] Call mutate a$5_@0.push(read props$4.c)
      [5] Const mutate $6:TPrimitive = null
      return read $6:TPrimitive
    }
    [7] Call mutate a$5_@0.push(read props$4.d)
  }
  return freeze a$5_@0
}

```

## Code

```javascript
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

```
## HIR

```
bb0:
  [1] Const mutate a$4_@0[1:7] = Array []
  [2] Call mutate a$4_@0.push(read props$3.a)
  [3] If (read props$3.b) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Call mutate a$4_@0.push(read props$3.c)
  [5] Return freeze a$4_@0
bb1:
  predecessor blocks: bb0
  [6] Call mutate a$4_@0.push(read props$3.d)
  [7] Return freeze a$4_@0
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:7] deps=[read props$3.a, read props$3.b, read props$3.c, read props$3.d] out=[a$4_@0] {
    [1] Const mutate a$4_@0[1:7] = Array []
    [2] Call mutate a$4_@0.push(read props$3.a)
    if (read props$3.b) {
      [4] Call mutate a$4_@0.push(read props$3.c)
      return freeze a$4_@0
    }
    [6] Call mutate a$4_@0.push(read props$3.d)
  }
  return freeze a$4_@0
}

```

## Code

```javascript
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
## HIR

```
bb0:
  [1] Const mutate a$4_@0[1:7] = Array []
  [2] Call mutate a$4_@0.push(read props$3.a)
  [3] If (read props$3.b) then:bb1 else:bb2 fallthrough=bb2
bb2:
  predecessor blocks: bb0
  [4] Call mutate a$4_@0.push(read props$3.c)
  [5] Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  [6] Call mutate a$4_@0.push(read props$3.d)
  [7] Return freeze a$4_@0
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Const mutate a$4_@0[1:7] = Array []
  [2] Call mutate a$4_@0.push(read props$3.a)
  if (read props$3.b) {
    [6] Call mutate a$4_@0.push(read props$3.d)
    return freeze a$4_@0
  }
  [4] Call mutate a$4_@0.push(read props$3.c)
}

```

## Code

```javascript
function Component(props) {
  const a = [];
  a.push(props.a);
  if (props.b) {
    a.push(props.d);
    return a;
  }

  a.push(props.c);
}

```
      