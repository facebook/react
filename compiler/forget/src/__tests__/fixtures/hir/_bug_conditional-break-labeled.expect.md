
## Input

```javascript
/**
 * props.b *does* influence `a`
 */
function Component(props) {
  const a = [];
  a.push(props.a);
  label: {
    if (props.b) {
      break label;
    }
    a.push(props.c);
  }
  a.push(props.d);
  return a;
}

```

## HIR

```
bb0:
  [1] Const mutate a$4_@0:TFunction[1:7] = Array []
  [2] Call mutate a$4_@0.push(read props$3.a)
  [3] If (read props$3.b) then:bb1 else:bb2 fallthrough=bb2
bb2:
  predecessor blocks: bb0
  [4] Call mutate a$4_@0.push(read props$3.c)
  [5] Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  [6] Call mutate a$4_@0.push(read props$3.d)
  [7] Return freeze a$4_@0:TFunction
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:7] deps=[read props$3.a, read props$3.b, read props$3.d, read props$3.c] out=[] {
    [1] Const mutate a$4_@0:TFunction[1:7] = Array []
    [2] Call mutate a$4_@0.push(read props$3.a)
    if (read props$3.b) {
      [6] Call mutate a$4_@0.push(read props$3.d)
      return freeze a$4_@0:TFunction
    }
    [4] Call mutate a$4_@0.push(read props$3.c)
  }
}

```

## Code

```javascript
function Component$0(props$3) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props$3.a;
  const c_1 = $[1] !== props$3.b;
  const c_2 = $[2] !== props$3.d;
  const c_3 = $[3] !== props$3.c;
  if (c_0 || c_1 || c_2 || c_3) {
    const a$4 = [];
    a$4.push(props$3.a);

    bb2: if (props$3.b) {
      a$4.push(props$3.d);
      return a$4;
    }

    a$4.push(props$3.c);
    $[0] = props$3.a;
    $[1] = props$3.b;
    $[2] = props$3.d;
    $[3] = props$3.c;
  } else {
  }
}

```
      