
## Input

```javascript
function Component(props) {
  let x = [];
  x.push(props.p0);
  let y = x;

  x = [];
  let _ = <Component x={x} />;

  y.push(props.p1);

  return <Component x={x} y={y} />;
}

```

## HIR

```
bb0:
  [1] Let mutate x$7[1:2] = Array []
  [2] Call mutate x$7.push(read props$6.p0)
  [3] Let mutate y$8[3:6] = read x$7
  [4] Reassign mutate x$9 = Array []
  [5] Let mutate _$10 = JSX <read Component$0 x={freeze x$9} ></read Component$0>
  [6] Call mutate y$8.push(read props$6.p1)
  [7] Const mutate $11 = JSX <read Component$0 x={read x$9} y={freeze y$8} ></read Component$0>
  Return read $11
```

## Code

```javascript
function Component$0(props$6) {
  let x$7 = [];
  x$7.push(props$6.p0);
  let y$8 = x$7;
  x$9 = [];
  let _$10 = <Component$0 x={x$9}></Component$0>;

  y$8.push(props$6.p1);
  return <Component$0 x={x$9} y={y$8}></Component$0>;
}

```
      