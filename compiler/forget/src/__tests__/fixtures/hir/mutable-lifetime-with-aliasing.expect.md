
## Input

```javascript
function mutate(x, y) {}

function Component(props) {
  const a = {};
  const b = [a]; // array elements alias
  const c = {};
  const d = { c }; // object values alias

  // capture all the values into this object
  const x = {};
  x.b = b;
  const y = mutate(x, d); // mutation aliases the arg and return value

  // all of these tests are seemingly readonly, since the values are never directly
  // mutated again. but they are all aliased by `x`, which is later modified, and
  // these are therefore mutable references:
  if (a) {
  }
  if (b) {
  }
  if (c) {
  }
  if (d) {
  }
  if (y) {
  }

  // could in theory mutate any of a/b/c/x/z, so the above should be inferred as mutable
  mutate(x, null);
}

```

## HIR

```
bb0:
  Return
```

## Code

```javascript
function mutate$0(x$1, y$2) {
  return;
}

```
## HIR

```
bb0:
  Const mutable a$2 = Object {  }
  Const mutable b$3 = Array [readonly a$2]
  Const mutable c$4 = Object {  }
  Const mutable d$5 = Object { c: readonly c$4 }
  Const mutable x$6 = Object {  }
  Reassign mutable x$6.b = readonly b$3
  Const mutable y$7 = Call mutable mutate$8(mutable x$6, mutable d$5)
  If (readonly a$2) then:bb1 else:bb1
bb1:
  If (readonly b$3) then:bb3 else:bb3
bb3:
  If (readonly c$4) then:bb5 else:bb5
bb5:
  If (readonly d$5) then:bb7 else:bb7
bb7:
  If (readonly y$7) then:bb9 else:bb9
bb9:
  Const mutable $9 = null
  Call mutable mutate$8(mutable x$6, readonly $9)
  Return
```

## Code

```javascript
function Component$0(props$1) {
  const a$2 = {};
  const b$3 = [a$2];
  const c$4 = {};
  const d$5 = {
    c: c$4,
  };
  const x$6 = {};
  x$6 = b$3;
  const y$7 = mutate$8(x$6, d$5);
  if (a$2) {
    if (b$3) {
      if (c$4) {
        if (d$5) {
          if (y$7) {
            mutate$8(x$6, null);
            return;
          }
          mutate$8(x$6, null);
          return;
        }
        if (y$7) {
          mutate$8(x$6, null);
          return;
        }
        mutate$8(x$6, null);
        return;
      }
      if (d$5) {
        if (y$7) {
          mutate$8(x$6, null);
          return;
        }
        mutate$8(x$6, null);
        return;
      }
      if (y$7) {
        mutate$8(x$6, null);
        return;
      }
      mutate$8(x$6, null);
      return;
    }
    if (c$4) {
      if (d$5) {
        if (y$7) {
          mutate$8(x$6, null);
          return;
        }
        mutate$8(x$6, null);
        return;
      }
      if (y$7) {
        mutate$8(x$6, null);
        return;
      }
      mutate$8(x$6, null);
      return;
    }
    if (d$5) {
      if (y$7) {
        mutate$8(x$6, null);
        return;
      }
      mutate$8(x$6, null);
      return;
    }
    if (y$7) {
      mutate$8(x$6, null);
      return;
    }
    mutate$8(x$6, null);
    return;
  }
  if (b$3) {
    if (c$4) {
      if (d$5) {
        if (y$7) {
          mutate$8(x$6, null);
          return;
        }
        mutate$8(x$6, null);
        return;
      }
      if (y$7) {
        mutate$8(x$6, null);
        return;
      }
      mutate$8(x$6, null);
      return;
    }
    if (d$5) {
      if (y$7) {
        mutate$8(x$6, null);
        return;
      }
      mutate$8(x$6, null);
      return;
    }
    if (y$7) {
      mutate$8(x$6, null);
      return;
    }
    mutate$8(x$6, null);
    return;
  }
  if (c$4) {
    if (d$5) {
      if (y$7) {
        mutate$8(x$6, null);
        return;
      }
      mutate$8(x$6, null);
      return;
    }
    if (y$7) {
      mutate$8(x$6, null);
      return;
    }
    mutate$8(x$6, null);
    return;
  }
  if (d$5) {
    if (y$7) {
      mutate$8(x$6, null);
      return;
    }
    mutate$8(x$6, null);
    return;
  }
  if (y$7) {
    mutate$8(x$6, null);
    return;
  }
  mutate$8(x$6, null);
  return;
}

```
      