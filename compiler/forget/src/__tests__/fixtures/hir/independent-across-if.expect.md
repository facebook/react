
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
  mutable a$2 = Call mutable compute$3(frozen props$1.a)
  mutable b$4 = Call mutable compute$3(frozen props$1.b)
  If (frozen props$1.c) then:bb2 else:bb1
bb2:
  Call mutable mutate$5(mutable a$2)
  Call mutable mutate$5(mutable b$4)
  Goto bb1
bb1:
  frozen $7 = JSX <frozen Foo$6 a={readonly a$2} b={readonly b$4} ></frozen Foo$6>
  Return frozen $7
```

## Code

```javascript
function Component$0(props$1) {
  a$2 = compute$3(props$1.a);
  b$4 = compute$3(props$1.b);
  if (props$1.c) {
    mutate$5(a$2);
    mutate$5(b$4);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  return <Foo$6 a={a$2} b={b$4}></Foo$6>;
}

```
      