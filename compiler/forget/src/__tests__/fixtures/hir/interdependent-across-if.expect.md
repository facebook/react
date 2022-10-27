
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
  Return
```

## Code

```javascript
function compute$0() {
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
  Return
```

## Code

```javascript
function Foo$0() {
  return;
}

```
## HIR

```
bb0:
  Const mutate a$9 = Call mutate compute$3(read props$8.a)
  Const mutate b$10 = Call mutate compute$3(read props$8.b)
  If (read props$8.c) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Call mutate foo$5(mutate a$9, mutate b$10)
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  Foo$11: phi(bb0: Foo$6, bb2: Foo$6)
  a$12: phi(bb0: a$9, bb2: a$9)
  b$13: phi(bb0: b$10, bb2: b$10)
  Const mutate $14 = JSX <read Foo$11 a={freeze a$12} b={freeze b$13} ></read Foo$11>
  Return read $14
```

## Code

```javascript
function Component$0(props$8) {
  const a$9 = compute$3(props$8.a);
  const b$10 = compute$3(props$8.b);
  if (props$8.c) {
    foo$5(a$9, b$10);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  return <Foo$11 a={a$12} b={b$13}></Foo$11>;
}

```
      