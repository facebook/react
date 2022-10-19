
## Input

```javascript
function compute() {}
function mutate() {}
function foo() {}
function Foo() {}

/**
 * Should produce 3 scopes:
 *
 * a: inputs=props.a & props.c; outputs=a
 *   a = compute(props.a);
 *   if (props.c)
 *     mutate(a)
 * b: inputs=props.b & props.c; outputs=b
 *   b = compute(props.b);
 *   if (props.c)
 *     mutate(b)
 * return: inputs=a, b outputs=return
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  if (props.c) {
    mutate(a);
    mutate(b);
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
function mutate$0() {
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
  Const mutate a$2 = Call mutate compute$3(read props$1.a)
  Const mutate b$4 = Call mutate compute$3(read props$1.b)
  If (read props$1.c) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Call mutate mutate$5(mutate a$2)
  Call mutate mutate$5(mutate b$4)
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  Const mutate $7 = JSX <read Foo$6 a={freeze a$2} b={freeze b$4} ></read Foo$6>
  Return read $7
```

## Code

```javascript
function Component$0(props$1) {
  const a$2 = compute$3(props$1.a);
  const b$4 = compute$3(props$1.b);
  if (props$1.c) {
    mutate$5(a$2);
    mutate$5(b$4);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  return <Foo$6 a={a$2} b={b$4}></Foo$6>;
}

```
      