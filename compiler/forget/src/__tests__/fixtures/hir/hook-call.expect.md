
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
  [1] Return

```

## Reactive Scopes

```
function useFreeze(
) {
  return
}

```

## Code

```javascript
function useFreeze$0() {}

```
## HIR

```
bb0:
  [1] Return

```

## Reactive Scopes

```
function foo(
) {
  return
}

```

## Code

```javascript
function foo$0() {}

```
## HIR

```
bb0:
  [1] Const mutate x$11_@0 = Array []
  [2] Const mutate y$12_@1 = Call read useFreeze$4:TFunction(freeze x$11_@0)
  [3] Call mutate foo$5:TFunction(read y$12_@1, read x$11_@0)
  [4] Const mutate $13_@2 = "\n      "
  [5] Const mutate $14_@3 = "\n      "
  [6] Const mutate $15_@4 = "\n    "
  [7] Const mutate $16_@5 = JSX <read Component$0>{read $13_@2}{read x$11_@0}{read $14_@3}{read y$12_@1}{read $15_@4}</read Component$0>
  [8] Return read $16_@5
scope1 [2:3]:
  - dependency: freeze x$11_@0
  - dependency: read x$11_@0
scope5 [7:8]:
  - dependency: read Component$0
  - dependency: read $13_@2
  - dependency: read x$11_@0
  - dependency: read $14_@3
  - dependency: read y$12_@1
  - dependency: read $15_@4
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:2] deps=[] {
    [1] Const mutate x$11_@0 = Array []
  }
  scope @1 [2:3] deps=[freeze x$11_@0, read x$11_@0] {
    [2] Const mutate y$12_@1 = Call read useFreeze$4:TFunction(freeze x$11_@0)
  }
  [3] Call mutate foo$5:TFunction(read y$12_@1, read x$11_@0)
  [4] Const mutate $13_@2 = "\n      "
  [5] Const mutate $14_@3 = "\n      "
  [6] Const mutate $15_@4 = "\n    "
  scope @5 [7:8] deps=[read Component$0, read $13_@2, read x$11_@0, read $14_@3, read y$12_@1, read $15_@4] {
    [7] Const mutate $16_@5 = JSX <read Component$0>{read $13_@2}{read x$11_@0}{read $14_@3}{read y$12_@1}{read $15_@4}</read Component$0>
  }
  return read $16_@5
}

```

## Code

```javascript
function Component$0(props$10) {
  const x$11 = [];
  const y$12 = useFreeze$4(x$11);
  foo$5(y$12, x$11);
  return (
    <Component$0>
      {x$11}
      {y$12}
    </Component$0>
  );
}

```
      