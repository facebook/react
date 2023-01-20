
## Input

```javascript
function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
  let i = 0;
  var x = [];

  class Bar {}

  with (true) {
  }

  const g = { ...a };
  const h = [...b];
  new c(...args);
  c(...args);
  g["e"] += 1;

  <Button {...args}></Button>;
  <Button xlink:href="localhost:3000"></Button>;
  <Button haha={1}></Button>;

  const j = function bar([quz, qux], ...args) {};

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
  10 |   const g = { ...a };

[ReactForget] TodoError: Handle object property spread
   8 |   }
   9 |
> 10 |   const g = { ...a };
     |               ^^^^
  11 |   const h = [...b];
  12 |   new c(...args);
  13 |   c(...args);

[ReactForget] TodoError: Handle non-expression array elements
   9 |
  10 |   const g = { ...a };
> 11 |   const h = [...b];
     |              ^^^^
  12 |   new c(...args);
  13 |   c(...args);
  14 |   g["e"] += 1;

[ReactForget] TodoError: Support non-expression arguments to NewExpression
  10 |   const g = { ...a };
  11 |   const h = [...b];
> 12 |   new c(...args);
     |         ^^^^^^^
  13 |   c(...args);
  14 |   g["e"] += 1;
  15 |

[ReactForget] TodoError: Support non-expression arguments to CallExpression
  11 |   const h = [...b];
  12 |   new c(...args);
> 13 |   c(...args);
     |     ^^^^^^^
  14 |   g["e"] += 1;
  15 |
  16 |   <Button {...args}></Button>;

[ReactForget] TodoError: Assignment expression to dynamic properties is not yet supported
  12 |   new c(...args);
  13 |   c(...args);
> 14 |   g["e"] += 1;
     |     ^^^
  15 |
  16 |   <Button {...args}></Button>;
  17 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: Handle spread attributes
  14 |   g["e"] += 1;
  15 |
> 16 |   <Button {...args}></Button>;
     |           ^^^^^^^^^
  17 |   <Button xlink:href="localhost:3000"></Button>;
  18 |   <Button haha={1}></Button>;
  19 |

[ReactForget] TodoError: Handle non-identifier jsx attribute names
  15 |
  16 |   <Button {...args}></Button>;
> 17 |   <Button xlink:href="localhost:3000"></Button>;
     |           ^^^^^^^^^^
  18 |   <Button haha={1}></Button>;
  19 |
  20 |   const j = function bar([quz, qux], ...args) {};

[ReactForget] TodoError: Handle non identifier params
  18 |   <Button haha={1}></Button>;
  19 |
> 20 |   const j = function bar([quz, qux], ...args) {};
     |                          ^^^^^^^^^^
  21 |
  22 |   for (; i < 3; i += 1) {
  23 |     x.push(i);

[ReactForget] TodoError: Handle non identifier params
  18 |   <Button haha={1}></Button>;
  19 |
> 20 |   const j = function bar([quz, qux], ...args) {};
     |                                      ^^^^^^^
  21 |
  22 |   for (; i < 3; i += 1) {
  23 |     x.push(i);

[ReactForget] TodoError: Support non-variable initialization in for
  20 |   const j = function bar([quz, qux], ...args) {};
  21 |
> 22 |   for (; i < 3; i += 1) {
     |   ^
  23 |     x.push(i);
  24 |   }
  25 |   for (; i < 3; ) {}

[ReactForget] TodoError: Support non-variable initialization in for
  23 |     x.push(i);
  24 |   }
> 25 |   for (; i < 3; ) {}
     |   ^^^^^^^^^^^^^^^^^^
  26 |   for (;;) {}
  27 | }
  28 |

[ReactForget] TodoError: Handle empty for updater
  23 |     x.push(i);
  24 |   }
> 25 |   for (; i < 3; ) {}
     |   ^^^^^^^^^^^^^^^^^^
  26 |   for (;;) {}
  27 | }
  28 |

[ReactForget] TodoError: Support non-variable initialization in for
  24 |   }
  25 |   for (; i < 3; ) {}
> 26 |   for (;;) {}
     |   ^^^^^^^^^^^
  27 | }
  28 |

[ReactForget] TodoError: Handle empty for updater
  24 |   }
  25 |   for (; i < 3; ) {}
> 26 |   for (;;) {}
     |   ^^^^^^^^^^^
  27 | }
  28 |

[ReactForget] TodoError: ForStatement without test
  24 |   }
  25 |   for (; i < 3; ) {}
> 26 |   for (;;) {}
     |   ^^^^^^^^^^^
  27 | }
  28 |
```
          
      