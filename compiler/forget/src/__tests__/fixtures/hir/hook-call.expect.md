
## Input

```javascript
function useFreeze() {}
function foo() {}

function Component(props) {
  const x = [];
  const y = useFreeze(x);
  foo(y, x);
  return (
    <Component>
      {x}
      {y}
    </Component>
  );
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
function foo$0() {
  return;
}

```
## HIR

```
bb0:
  frozen x$2 = Array []
  frozen y$3 = Call frozen useFreeze$4(frozen x$2)
  Call mutable foo$5(frozen y$3, frozen x$2)
  frozen $6 = "\n      "
  frozen $7 = "\n      "
  frozen $8 = "\n    "
  frozen $9 = JSX <frozen Component$0>{frozen $6}{frozen x$2}{frozen $7}{frozen y$3}{frozen $8}</frozen Component$0>
  Return frozen $9
```

## Code

```javascript
function Component$0(props$1) {
  x$2 = [];
  y$3 = useFreeze$4(x$2);
  foo$5(y$3, x$2);
  return (
    <Component$0>
      {x$2}
      {y$3}
    </Component$0>
  );
}

```
      