
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
  Const mutate cond$2 = read props$1.cond
  Const mutate x$3 = read props$1.x
  Let mutate a$4 = undefined
  If (read cond$2) then:bb2 else:bb3
bb2:
  Reassign mutate a$4 = read x$3
  Goto bb1
bb3:
  Reassign mutate a$4 = Array []
  Goto bb1
bb1:
  Call read useFreeze$5(freeze a$4)
  Call read useFreeze$5(read a$4)
  Call mutate call$6(read a$4)
  Return read a$4
```

## Code

```javascript
function Component$0(props$1) {
  const cond$2 = props$1.cond;
  const x$3 = props$1.x;
  let a$4 = undefined;
  if (cond$2) {
    a$4 = x$3;
    ("<<TODO: handle complex control flow in codegen>>");
  } else {
    a$4 = [];
    ("<<TODO: handle complex control flow in codegen>>");
  }
  useFreeze$5(a$4);
  useFreeze$5(a$4);
  call$6(a$4);
  return a$4;
}

```
## HIR

```
bb0:
  Return
```

## Code

```javascript
function useFreeze$0(x$1) {
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
function call$0(x$1) {
  return;
}

```
      