
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

[ReactForget] TodoError: Handle object property spread
  10 |   }
  11 |
> 12 |   const g = { ...a };
     |               ^^^^
  13 |   const h = [...b];
  14 |   new c(...args);
  15 |   c(...args);

[ReactForget] TodoError: Handle non-expression array elements
  11 |
  12 |   const g = { ...a };
> 13 |   const h = [...b];
     |              ^^^^
  14 |   new c(...args);
  15 |   c(...args);
  16 |   g["e"] += 1;

[ReactForget] TodoError: Support non-expression arguments to NewExpression
  12 |   const g = { ...a };
  13 |   const h = [...b];
> 14 |   new c(...args);
     |         ^^^^^^^
  15 |   c(...args);
  16 |   g["e"] += 1;
  17 |   const [y, ...yy] = useState(0);

[ReactForget] TodoError: Support non-expression arguments to CallExpression
  13 |   const h = [...b];
  14 |   new c(...args);
> 15 |   c(...args);
     |     ^^^^^^^
  16 |   g["e"] += 1;
  17 |   const [y, ...yy] = useState(0);
  18 |   const { z, aa = "aa", ...zz } = useCustom();

[ReactForget] TodoError: Assignment expression to dynamic properties is not yet supported
  14 |   new c(...args);
  15 |   c(...args);
> 16 |   g["e"] += 1;
     |     ^^^
  17 |   const [y, ...yy] = useState(0);
  18 |   const { z, aa = "aa", ...zz } = useCustom();
  19 |

[ReactForget] TodoError: Rest elements are not supported yet
  15 |   c(...args);
  16 |   g["e"] += 1;
> 17 |   const [y, ...yy] = useState(0);
     |             ^^^^^
  18 |   const { z, aa = "aa", ...zz } = useCustom();
  19 |
  20 |   <Button {...args}></Button>;

[ReactForget] TodoError: Support other lvalue types beyond identifier
  16 |   g["e"] += 1;
  17 |   const [y, ...yy] = useState(0);
> 18 |   const { z, aa = "aa", ...zz } = useCustom();
     |              ^^^^^^^^^
  19 |
  20 |   <Button {...args}></Button>;
  21 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: Rest elements are not supported yet
  16 |   g["e"] += 1;
  17 |   const [y, ...yy] = useState(0);
> 18 |   const { z, aa = "aa", ...zz } = useCustom();
     |                         ^^^^^
  19 |
  20 |   <Button {...args}></Button>;
  21 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: Handle spread attributes
  18 |   const { z, aa = "aa", ...zz } = useCustom();
  19 |
> 20 |   <Button {...args}></Button>;
     |           ^^^^^^^^^
  21 |   <Button xlink:href="localhost:3000"></Button>;
  22 |   <Button haha={1}></Button>;
  23 |   <Button>{/** empty */}</Button>;

[ReactForget] TodoError: Handle non-identifier jsx attribute names
  19 |
  20 |   <Button {...args}></Button>;
> 21 |   <Button xlink:href="localhost:3000"></Button>;
     |           ^^^^^^^^^^
  22 |   <Button haha={1}></Button>;
  23 |   <Button>{/** empty */}</Button>;
  24 |   <DesignSystem.Button />;

[ReactForget] TodoError: Handle empty expressions
  21 |   <Button xlink:href="localhost:3000"></Button>;
  22 |   <Button haha={1}></Button>;
> 23 |   <Button>{/** empty */}</Button>;
     |            ^^^^^^^^^^^^
  24 |   <DesignSystem.Button />;
  25 |
  26 |   const j = function bar([quz, qux], ...args) {};

[ReactForget] TodoError: Handle non-identifier tags
  22 |   <Button haha={1}></Button>;
  23 |   <Button>{/** empty */}</Button>;
> 24 |   <DesignSystem.Button />;
     |    ^^^^^^^^^^^^^^^^^^^
  25 |
  26 |   const j = function bar([quz, qux], ...args) {};
  27 |

[ReactForget] TodoError: Support non-identifier params: ArrayPattern
  24 |   <DesignSystem.Button />;
  25 |
> 26 |   const j = function bar([quz, qux], ...args) {};
     |                          ^^^^^^^^^^
  27 |
  28 |   for (; i < 3; i += 1) {
  29 |     x.push(i);

[ReactForget] TodoError: Support non-identifier params: RestElement
  24 |   <DesignSystem.Button />;
  25 |
> 26 |   const j = function bar([quz, qux], ...args) {};
     |                                      ^^^^^^^
  27 |
  28 |   for (; i < 3; i += 1) {
  29 |     x.push(i);

[ReactForget] TodoError: Support non-variable initialization in for
  26 |   const j = function bar([quz, qux], ...args) {};
  27 |
> 28 |   for (; i < 3; i += 1) {
     |   ^
  29 |     x.push(i);
  30 |   }
  31 |   for (; i < 3; ) {}

[ReactForget] TodoError: Support non-variable initialization in for
  29 |     x.push(i);
  30 |   }
> 31 |   for (; i < 3; ) {}
     |   ^^^^^^^^^^^^^^^^^^
  32 |   for (;;) {}
  33 | }
  34 |

[ReactForget] TodoError: Handle empty for updater
  29 |     x.push(i);
  30 |   }
> 31 |   for (; i < 3; ) {}
     |   ^^^^^^^^^^^^^^^^^^
  32 |   for (;;) {}
  33 | }
  34 |

[ReactForget] TodoError: Support non-variable initialization in for
  30 |   }
  31 |   for (; i < 3; ) {}
> 32 |   for (;;) {}
     |   ^^^^^^^^^^^
  33 | }
  34 |

[ReactForget] TodoError: Handle empty for updater
  30 |   }
  31 |   for (; i < 3; ) {}
> 32 |   for (;;) {}
     |   ^^^^^^^^^^^
  33 | }
  34 |

[ReactForget] TodoError: ForStatement without test
  30 |   }
  31 |   for (; i < 3; ) {}
> 32 |   for (;;) {}
     |   ^^^^^^^^^^^
  33 | }
  34 |
```
          
      