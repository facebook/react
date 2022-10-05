
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
  readonly a$2 = Call mutable compute$3(frozen props$1.a)
  readonly b$4 = Call mutable compute$3(frozen props$1.b)
  If (frozen props$1.c) then:bb2 else:bb1
bb2:
  Call mutable foo$5(mutable a$2, mutable b$4)
  Goto bb1
bb1:
  readonly $7 = JSX <frozen Foo$6 a={frozen a$2} b={frozen b$4} ></frozen Foo$6>
  Return frozen $7
```

## Code

```javascript
function Component$0(props$1) {
  a$2 = compute$3(props$1.a);
  b$4 = compute$3(props$1.b);
  if (props$1.c) {
    foo$5(a$2, b$4);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  return <Foo$6 a={a$2} b={b$4}></Foo$6>;
}

```
      