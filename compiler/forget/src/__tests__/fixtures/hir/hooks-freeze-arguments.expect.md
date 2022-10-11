
## Input

```javascript
function Component() {
  const a = [];
  useFreeze(a); // should freeze
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
  Const mutable a$1 = Array []
  Call readonly useFreeze$2(freeze a$1)
  Call readonly useFreeze$2(readonly a$1)
  Call mutable call$3(readonly a$1)
  Return readonly a$1
```

## Code

```javascript
function Component$0() {
  const a$1 = [];
  useFreeze$2(a$1);
  useFreeze$2(a$1);
  call$3(a$1);
  return a$1;
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
      