
## Input

```javascript
function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
  let i = 0;
  var x = [];

  class Bar {}

  with (true) {
  }

  for (; i < 3; i += 1) {
    x.push(i);
  }
  for (; i < 3; ) {}
  for (;;) {}
}

```


## Error

```
[ReactForget] TodoError: Support non-identifier params: ArrayPattern
> 1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
    |              ^^^^^^
  2 |   let i = 0;
  3 |   var x = [];
  4 |

[ReactForget] TodoError: Support non-identifier params: ObjectPattern
> 1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
    |                      ^^^^^^^^^^^^^^^^^
  2 |   let i = 0;
  3 |   var x = [];
  4 |

[ReactForget] TodoError: Support non-identifier params: AssignmentPattern
> 1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
    |                                         ^^^^^^^
  2 |   let i = 0;
  3 |   var x = [];
  4 |

[ReactForget] TodoError: Support non-identifier params: RestElement
> 1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
    |                                                  ^^^^^^^
  2 |   let i = 0;
  3 |   var x = [];
  4 |

[ReactForget] TodoError: `var` declarations are not supported, use let or const
  1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
  2 |   let i = 0;
> 3 |   var x = [];
    |   ^^^^^^^^^^^
  4 |
  5 |   class Bar {}
  6 |

[ReactForget] TodoError: Unhandled statement type: ClassDeclaration
  3 |   var x = [];
  4 |
> 5 |   class Bar {}
    |   ^^^^^^^^^^^^
  6 |
  7 |   with (true) {
  8 |   }

[ReactForget] TodoError: Unhandled statement type: WithStatement
   5 |   class Bar {}
   6 |
>  7 |   with (true) {
     |   ^
   8 |   }
   9 |
  10 |   for (; i < 3; i += 1) {

[ReactForget] TodoError: Support non-variable initialization in for
   8 |   }
   9 |
> 10 |   for (; i < 3; i += 1) {
     |   ^
  11 |     x.push(i);
  12 |   }
  13 |   for (; i < 3; ) {}

[ReactForget] TodoError: Support non-variable initialization in for
  11 |     x.push(i);
  12 |   }
> 13 |   for (; i < 3; ) {}
     |   ^^^^^^^^^^^^^^^^^^
  14 |   for (;;) {}
  15 | }
  16 |

[ReactForget] TodoError: Handle empty for updater
  11 |     x.push(i);
  12 |   }
> 13 |   for (; i < 3; ) {}
     |   ^^^^^^^^^^^^^^^^^^
  14 |   for (;;) {}
  15 | }
  16 |

[ReactForget] TodoError: Support non-variable initialization in for
  12 |   }
  13 |   for (; i < 3; ) {}
> 14 |   for (;;) {}
     |   ^^^^^^^^^^^
  15 | }
  16 |

[ReactForget] TodoError: Handle empty for updater
  12 |   }
  13 |   for (; i < 3; ) {}
> 14 |   for (;;) {}
     |   ^^^^^^^^^^^
  15 | }
  16 |

[ReactForget] TodoError: ForStatement without test
  12 |   }
  13 |   for (; i < 3; ) {}
> 14 |   for (;;) {}
     |   ^^^^^^^^^^^
  15 | }
  16 |
```
          
      