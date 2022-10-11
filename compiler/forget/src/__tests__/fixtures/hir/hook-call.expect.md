
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
  Const mutable x$2 = Array []
  Const mutable y$3 = Call readonly useFreeze$4(freeze x$2)
  Call mutable foo$5(readonly y$3, readonly x$2)
  Const mutable $6 = "\n      "
  Const mutable $7 = "\n      "
  Const mutable $8 = "\n    "
  Const mutable $9 = JSX <readonly Component$0>{readonly $6}{readonly x$2}{readonly $7}{readonly y$3}{readonly $8}</readonly Component$0>
  Return readonly $9
```

## Code

```javascript
function Component$0(props$1) {
  const x$2 = [];
  const y$3 = useFreeze$4(x$2);
  foo$5(y$3, x$2);
  return (
    <Component$0>
      {x$2}
      {y$3}
    </Component$0>
  );
}

```
      