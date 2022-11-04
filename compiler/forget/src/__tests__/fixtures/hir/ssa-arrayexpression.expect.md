
## Input

```javascript
function Component(props) {
  const a = 1;
  const b = 2;
  const x = [a, b];
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate a$6 = 1
  [2] Const mutate b$7 = 2
  [3] Const mutate x$8 = Array [read a$6, read b$7]
  Return freeze x$8
```

## Code

```javascript
function Component$0(props$5) {
  const a$6 = 1;
  const b$7 = 2;
  const x$8 = [a$6, b$7];
  return x$8;
}

```
      