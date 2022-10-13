
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
  Const mutate a$1 = Array []
  Call read useFreeze$2(freeze a$1)
  Call read useFreeze$2(read a$1)
  Call mutate call$3(read a$1)
  Return read a$1
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
      