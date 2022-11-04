
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
  [1] Const mutate a_DEBUG$5 = Array []
  [2] Call mutate a_DEBUG$5.push(read props$4.a)
  If (read props$4.b) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate $6 = null
  Return read $6
bb1:
  predecessor blocks: bb0
  [4] Call mutate a_DEBUG$5.push(read props$4.d)
  Return freeze a_DEBUG$5
```

## Code

```javascript
function Component$0(props$4) {
  const a_DEBUG$5 = [];
  a_DEBUG$5.push(props$4.a);
  if (props$4.b) {
    return null;
  }

  a_DEBUG$5.push(props$4.d);
  return a_DEBUG$5;
}

```
## HIR

```
bb0:
  [1] Const mutate a$4 = Array []
  [2] Call mutate a$4.push(read props$3.a)
  If (read props$3.b) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [3] Call mutate a$4.push(read props$3.c)
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  [4] Call mutate a$4.push(read props$3.d)
  Return freeze a$4
```

## Code

```javascript
function Component$0(props$3) {
  const a$4 = [];
  a$4.push(props$3.a);
  if (props$3.b) {
    a$4.push(props$3.c);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  a$4.push(props$3.d);
  return a$4;
}

```
## HIR

```
bb0:
  [1] Const mutate a$5 = Array []
  [2] Call mutate a$5.push(read props$4.a)
  If (read props$4.b) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [3] Call mutate a$5.push(read props$4.c)
  [4] Const mutate $6 = null
  Return read $6
bb1:
  predecessor blocks: bb0
  [5] Call mutate a$5.push(read props$4.d)
  Return freeze a$5
```

## Code

```javascript
function Component$0(props$4) {
  const a$5 = [];
  a$5.push(props$4.a);
  if (props$4.b) {
    a$5.push(props$4.c);
    return null;
  }

  a$5.push(props$4.d);
  return a$5;
}

```
## HIR

```
bb0:
  [1] Const mutate a$4 = Array []
  [2] Call mutate a$4.push(read props$3.a)
  If (read props$3.b) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [3] Call mutate a$4.push(read props$3.c)
  Return freeze a$4
bb1:
  predecessor blocks: bb0
  [4] Call mutate a$4.push(read props$3.d)
  Return freeze a$4
```

## Code

```javascript
function Component$0(props$3) {
  const a$4 = [];
  a$4.push(props$3.a);
  if (props$3.b) {
    a$4.push(props$3.c);
    return a$4;
  }

  a$4.push(props$3.d);
  return a$4;
}

```
## HIR

```
bb0:
  [1] Const mutate a$4 = Array []
  [2] Call mutate a$4.push(read props$3.a)
  If (read props$3.b) then:bb1 else:bb2
bb2:
  predecessor blocks: bb0
  [3] Call mutate a$4.push(read props$3.c)
  Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [4] Call mutate a$4.push(read props$3.d)
  Return freeze a$4
```

## Code

```javascript
function Component$0(props$3) {
  const a$4 = [];
  a$4.push(props$3.a);
  if (props$3.b) {
    a$4.push(props$3.d);
    return a$4;
  }

  a$4.push(props$3.c);
  ("<<TODO: handle complex control flow in codegen>>");
}

```
      