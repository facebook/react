
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
function mutate$0(x$3, y$4) {
  return;
}

```
## HIR

```
bb0:
  Const mutate a$11 = Object {  }
  Const mutate b$12 = Array [read a$11]
  Const mutate c$13 = Object {  }
  Const mutate d$14 = Object { c: read c$13 }
  Const mutate x$15 = Object {  }
  Reassign mutate x$15.b = read b$12
  Const mutate y$16 = Call mutate mutate$8(mutate x$15, mutate d$14)
  If (read a$11) then:bb1 else:bb1
bb1:
  predecessor blocks: bb0
  If (read b$12) then:bb3 else:bb3
bb3:
  predecessor blocks: bb1
  If (read c$13) then:bb5 else:bb5
bb5:
  predecessor blocks: bb3
  If (read d$14) then:bb7 else:bb7
bb7:
  predecessor blocks: bb5
  If (read y$16) then:bb9 else:bb9
bb9:
  predecessor blocks: bb7
  Const mutate $17 = null
  Call mutate mutate$8(mutate x$15, read $17)
  Return
```

## Code

```javascript
function Component$0(props$10) {
  const a$11 = {};
  const b$12 = [a$11];
  const c$13 = {};
  const d$14 = {
    c: c$13,
  };
  const x$15 = {};
  x$15 = b$12;
  const y$16 = mutate$8(x$15, d$14);
  if (a$11) {
    if (b$12) {
      if (c$13) {
        if (d$14) {
          if (y$16) {
            mutate$8(x$15, null);
            return;
          }

          mutate$8(x$15, null);
          return;
        }

        if (y$16) {
          mutate$8(x$15, null);
          return;
        }

        mutate$8(x$15, null);
        return;
      }

      if (d$14) {
        if (y$16) {
          mutate$8(x$15, null);
          return;
        }

        mutate$8(x$15, null);
        return;
      }

      if (y$16) {
        mutate$8(x$15, null);
        return;
      }

      mutate$8(x$15, null);
      return;
    }

    if (c$13) {
      if (d$14) {
        if (y$16) {
          mutate$8(x$15, null);
          return;
        }

        mutate$8(x$15, null);
        return;
      }

      if (y$16) {
        mutate$8(x$15, null);
        return;
      }

      mutate$8(x$15, null);
      return;
    }

    if (d$14) {
      if (y$16) {
        mutate$8(x$15, null);
        return;
      }

      mutate$8(x$15, null);
      return;
    }

    if (y$16) {
      mutate$8(x$15, null);
      return;
    }

    mutate$8(x$15, null);
    return;
  }

  if (b$12) {
    if (c$13) {
      if (d$14) {
        if (y$16) {
          mutate$8(x$15, null);
          return;
        }

        mutate$8(x$15, null);
        return;
      }

      if (y$16) {
        mutate$8(x$15, null);
        return;
      }

      mutate$8(x$15, null);
      return;
    }

    if (d$14) {
      if (y$16) {
        mutate$8(x$15, null);
        return;
      }

      mutate$8(x$15, null);
      return;
    }

    if (y$16) {
      mutate$8(x$15, null);
      return;
    }

    mutate$8(x$15, null);
    return;
  }

  if (c$13) {
    if (d$14) {
      if (y$16) {
        mutate$8(x$15, null);
        return;
      }

      mutate$8(x$15, null);
      return;
    }

    if (y$16) {
      mutate$8(x$15, null);
      return;
    }

    mutate$8(x$15, null);
    return;
  }

  if (d$14) {
    if (y$16) {
      mutate$8(x$15, null);
      return;
    }

    mutate$8(x$15, null);
    return;
  }

  if (y$16) {
    mutate$8(x$15, null);
    return;
  }

  mutate$8(x$15, null);
  return;
}

```
      