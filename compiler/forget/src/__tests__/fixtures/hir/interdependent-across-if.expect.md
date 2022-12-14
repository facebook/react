
## Input

```javascript
function compute() {}
function foo() {}
function Foo() {}

/**
 * Should produce 1 scope:
 *
 * return: inputs=props.a & props.b & props.c; outputs=return
 *   const a = compute(props.a);
 *   const b = compute(props.b);
 *   if (props.c)
 *     foo(a, b);
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  if (props.c) {
    foo(a, b);
  }
  return <Foo a={a} b={b} />;
}

```

## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function compute(
) {
  return
}

```

## Code

```javascript
function compute$0() {}

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
  [1] Return
```

## Reactive Scopes

```
function Foo(
) {
  return
}

```

## Code

```javascript
function Foo$0() {}

```
## HIR

```
bb0:
  [1] Const mutate a$9_@0[1:6] = Call mutate compute$3:TFunction(read props$8.a)
  [2] Const mutate b$10_@0[1:6] = Call mutate compute$3:TFunction(read props$8.b)
  [3] If (read props$8.c) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Call mutate foo$5:TFunction(mutate a$9_@0, mutate b$10_@0)
  [5] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [6] Const mutate $14_@1 = JSX <read Foo$6 a={freeze a$9_@0} b={freeze b$10_@0} ></read Foo$6>
  [7] Return read $14_@1
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:6] deps=[read props$8.a, read props$8.b, read props$8.c] {
    [1] Const mutate a$9_@0[1:6] = Call mutate compute$3:TFunction(read props$8.a)
    [2] Const mutate b$10_@0[1:6] = Call mutate compute$3:TFunction(read props$8.b)
    if (read props$8.c) {
      [4] Call mutate foo$5:TFunction(mutate a$9_@0, mutate b$10_@0)
    }
  }
  scope @1 [6:7] deps=[freeze a$9_@0, freeze b$10_@0] {
    [6] Const mutate $14_@1 = JSX <read Foo$6 a={freeze a$9_@0} b={freeze b$10_@0} ></read Foo$6>
  }
  return read $14_@1
}

```

## Code

```javascript
function Component$0(props$8) {
  const a$9 = compute$3(props$8.a);
  const b$10 = compute$3(props$8.b);
  bb1: if (props$8.c) {
    foo$5(a$9, b$10);
  }

  return <Foo$6 a={a$9} b={b$10}></Foo$6>;
}

```
      