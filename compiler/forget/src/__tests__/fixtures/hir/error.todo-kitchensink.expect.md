
## Input

```javascript
function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
  let i = 0;
  var x = [];

  class Bar {
    #secretSauce = 42;
    constructor() {
      console.log(this.#secretSauce);
    }
  }

  with (true) {
  }

  const g = { ...a };
  const h = [...b];
  new c(...args);
  c(...args);
  g["e"] += 1;
  const [y, ...yy] = useState(0);
  const { z, aa = "aa", ...zz } = useCustom();

  <Button {...args}></Button>;
  <Button xlink:href="localhost:3000"></Button>;
  <Button haha={1}></Button>;
  <Button>{/** empty */}</Button>;
  <DesignSystem.Button />;

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
  5 |   class Bar {
  6 |     #secretSauce = 42;

[ReactForget] TodoError: Unhandled statement type: ClassDeclaration
  3 |   var x = [];
  4 |
> 5 |   class Bar {
    |   ^
  6 |     #secretSauce = 42;
  7 |     constructor() {
  8 |       console.log(this.#secretSauce);

[ReactForget] TodoError: Unhandled statement type: WithStatement
  10 |   }
  11 |
> 12 |   with (true) {
     |   ^
  13 |   }
  14 |
  15 |   const g = { ...a };

[ReactForget] TodoError: Handle object property spread
  13 |   }
  14 |
> 15 |   const g = { ...a };
     |               ^^^^
  16 |   const h = [...b];
  17 |   new c(...args);
  18 |   c(...args);

[ReactForget] TodoError: Handle non-expression array elements
  14 |
  15 |   const g = { ...a };
> 16 |   const h = [...b];
     |              ^^^^
  17 |   new c(...args);
  18 |   c(...args);
  19 |   g["e"] += 1;

[ReactForget] TodoError: Support non-expression arguments to NewExpression
  15 |   const g = { ...a };
  16 |   const h = [...b];
> 17 |   new c(...args);
     |         ^^^^^^^
  18 |   c(...args);
  19 |   g["e"] += 1;
  20 |   const [y, ...yy] = useState(0);

[ReactForget] TodoError: Support non-expression arguments to CallExpression
  16 |   const h = [...b];
  17 |   new c(...args);
> 18 |   c(...args);
     |     ^^^^^^^
  19 |   g["e"] += 1;
  20 |   const [y, ...yy] = useState(0);
  21 |   const { z, aa = "aa", ...zz } = useCustom();

[ReactForget] TodoError: Assignment expression to dynamic properties is not yet supported
  17 |   new c(...args);
  18 |   c(...args);
> 19 |   g["e"] += 1;
     |     ^^^
  20 |   const [y, ...yy] = useState(0);
  21 |   const { z, aa = "aa", ...zz } = useCustom();
  22 |

[ReactForget] TodoError: Rest elements are not supported yet
  18 |   c(...args);
  19 |   g["e"] += 1;
> 20 |   const [y, ...yy] = useState(0);
     |             ^^^^^
  21 |   const { z, aa = "aa", ...zz } = useCustom();
  22 |
  23 |   <Button {...args}></Button>;

[ReactForget] TodoError: Support other lvalue types beyond identifier
  19 |   g["e"] += 1;
  20 |   const [y, ...yy] = useState(0);
> 21 |   const { z, aa = "aa", ...zz } = useCustom();
     |              ^^^^^^^^^
  22 |
  23 |   <Button {...args}></Button>;
  24 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: Rest elements are not supported yet
  19 |   g["e"] += 1;
  20 |   const [y, ...yy] = useState(0);
> 21 |   const { z, aa = "aa", ...zz } = useCustom();
     |                         ^^^^^
  22 |
  23 |   <Button {...args}></Button>;
  24 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: Handle spread attributes
  21 |   const { z, aa = "aa", ...zz } = useCustom();
  22 |
> 23 |   <Button {...args}></Button>;
     |           ^^^^^^^^^
  24 |   <Button xlink:href="localhost:3000"></Button>;
  25 |   <Button haha={1}></Button>;
  26 |   <Button>{/** empty */}</Button>;

[ReactForget] TodoError: Handle non-identifier jsx attribute names
  22 |
  23 |   <Button {...args}></Button>;
> 24 |   <Button xlink:href="localhost:3000"></Button>;
     |           ^^^^^^^^^^
  25 |   <Button haha={1}></Button>;
  26 |   <Button>{/** empty */}</Button>;
  27 |   <DesignSystem.Button />;

[ReactForget] TodoError: Handle empty expressions
  24 |   <Button xlink:href="localhost:3000"></Button>;
  25 |   <Button haha={1}></Button>;
> 26 |   <Button>{/** empty */}</Button>;
     |            ^^^^^^^^^^^^
  27 |   <DesignSystem.Button />;
  28 |
  29 |   const j = function bar([quz, qux], ...args) {};

[ReactForget] TodoError: Handle non-identifier tags
  25 |   <Button haha={1}></Button>;
  26 |   <Button>{/** empty */}</Button>;
> 27 |   <DesignSystem.Button />;
     |    ^^^^^^^^^^^^^^^^^^^
  28 |
  29 |   const j = function bar([quz, qux], ...args) {};
  30 |

[ReactForget] TodoError: Support non-identifier params: ArrayPattern
  27 |   <DesignSystem.Button />;
  28 |
> 29 |   const j = function bar([quz, qux], ...args) {};
     |                          ^^^^^^^^^^
  30 |
  31 |   for (; i < 3; i += 1) {
  32 |     x.push(i);

[ReactForget] TodoError: Support non-identifier params: RestElement
  27 |   <DesignSystem.Button />;
  28 |
> 29 |   const j = function bar([quz, qux], ...args) {};
     |                                      ^^^^^^^
  30 |
  31 |   for (; i < 3; i += 1) {
  32 |     x.push(i);

[ReactForget] TodoError: Support non-variable initialization in for
  29 |   const j = function bar([quz, qux], ...args) {};
  30 |
> 31 |   for (; i < 3; i += 1) {
     |   ^
  32 |     x.push(i);
  33 |   }
  34 |   for (; i < 3; ) {}

[ReactForget] TodoError: Support non-variable initialization in for
  32 |     x.push(i);
  33 |   }
> 34 |   for (; i < 3; ) {}
     |   ^^^^^^^^^^^^^^^^^^
  35 |   for (;;) {}
  36 | }
  37 |

[ReactForget] TodoError: Handle empty for updater
  32 |     x.push(i);
  33 |   }
> 34 |   for (; i < 3; ) {}
     |   ^^^^^^^^^^^^^^^^^^
  35 |   for (;;) {}
  36 | }
  37 |

[ReactForget] TodoError: Support non-variable initialization in for
  33 |   }
  34 |   for (; i < 3; ) {}
> 35 |   for (;;) {}
     |   ^^^^^^^^^^^
  36 | }
  37 |

[ReactForget] TodoError: Handle empty for updater
  33 |   }
  34 |   for (; i < 3; ) {}
> 35 |   for (;;) {}
     |   ^^^^^^^^^^^
  36 | }
  37 |

[ReactForget] TodoError: ForStatement without test
  33 |   }
  34 |   for (; i < 3; ) {}
> 35 |   for (;;) {}
     |   ^^^^^^^^^^^
  36 | }
  37 |
```
          
      