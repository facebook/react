
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
  Const mutate a$1 = Array []
  Const mutate b$2 = read a$1
  Call read useFreeze$3(freeze a$1)
  Call mutate foo$4(read b$2)
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
      