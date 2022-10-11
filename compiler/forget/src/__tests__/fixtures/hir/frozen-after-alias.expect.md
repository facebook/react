
## Input

```javascript
function Component() {
  const a = [];
  const b = a;
  useFreeze(a);
  foo(b); // should be readonly, value is guaranteed frozen via alias
}

function useFreeze() {}
function foo(x) {}

```

## HIR

```
bb0:
  Const mutable a$1 = Array []
  Const mutable b$2 = readonly a$1
  Call readonly useFreeze$3(freeze a$1)
  Call mutable foo$4(readonly b$2)
  Return
```

## Code

```javascript
function Component$0() {
  const a$1 = [];
  const b$2 = a$1;
  useFreeze$3(a$1);
  foo$4(b$2);
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
function useFreeze$0() {
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
function foo$0(x$1) {
  return;
}

```
      