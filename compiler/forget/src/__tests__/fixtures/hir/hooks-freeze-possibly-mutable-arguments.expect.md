
## Input

```javascript
function Component(props) {
  const cond = props.cond;
  const x = props.x;
  let a;
  if (cond) {
    a = x;
  } else {
    a = [];
  }
  useFreeze(a); // should freeze, value *may* be mutable
  useFreeze(a); // should be readonly
  call(a); // should be readonly
  return a;
}

function useFreeze(x) {}
function call(x) {}

```

## HIR

```
bb0:
  Const mutate cond$8 = read props$7.cond
  Const mutate x$9 = read props$7.x
  Let mutate a$10 = undefined
  If (read cond$8) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  Reassign mutate a$11 = read x$9
  Goto bb1
bb3:
  predecessor blocks: bb0
  Reassign mutate a$12 = Array []
  Goto bb1
bb1:
  predecessor blocks: bb3 bb2
  a$14: phi(bb3: a$12, bb2: a$11)
  Call read useFreeze$5(freeze a$14)
  Call read useFreeze$5(read a$14)
  Call mutate call$6(read a$14)
  Return read a$14
```

## Code

```javascript
function Component$0(props$7) {
  const cond$8 = props$7.cond;
  const x$9 = props$7.x;
  let a$10 = undefined;
  if (cond$8) {
    a$11 = x$9;
    ("<<TODO: handle complex control flow in codegen>>");
  } else {
    a$12 = [];
    ("<<TODO: handle complex control flow in codegen>>");
  }

  useFreeze$5(a$14);
  useFreeze$5(a$14);
  call$6(a$14);
  return a$14;
}

```
## HIR

```
bb0:
  Return
```

## Code

```javascript
function useFreeze$0(x$2) {
  return;
}

```
## HIR

```
bb0:
  Return
```

## Code

```javascript
function call$0(x$2) {
  return;
}

```
      