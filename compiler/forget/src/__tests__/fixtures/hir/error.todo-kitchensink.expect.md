
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

  const g = { ...a, b() {}, c: () => {} };
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
[ReactForget] TodoError: (BuildHIR::lower) Handle ArrayPattern params
> 1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
    |              ^^^^^^
  2 |   let i = 0;
  3 |   var x = [];
  4 |

[ReactForget] TodoError: (BuildHIR::lower) Handle ObjectPattern params
> 1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
    |                      ^^^^^^^^^^^^^^^^^
  2 |   let i = 0;
  3 |   var x = [];
  4 |

[ReactForget] TodoError: (BuildHIR::lower) Handle AssignmentPattern params
> 1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
    |                                         ^^^^^^^
  2 |   let i = 0;
  3 |   var x = [];
  4 |

[ReactForget] TodoError: (BuildHIR::lower) Handle RestElement params
> 1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
    |                                                  ^^^^^^^
  2 |   let i = 0;
  3 |   var x = [];
  4 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration
  1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
  2 |   let i = 0;
> 3 |   var x = [];
    |   ^^^^^^^^^^^
  4 |
  5 |   class Bar {
  6 |     #secretSauce = 42;

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ClassDeclaration statements
  3 |   var x = [];
  4 |
> 5 |   class Bar {
    |   ^
  6 |     #secretSauce = 42;
  7 |     constructor() {
  8 |       console.log(this.#secretSauce);

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle SpreadElement properties in ObjectExpression
  10 |   }
  11 |
> 12 |   const g = { ...a, b() {}, c: () => {} };
     |               ^^^^
  13 |   const h = [...b];
  14 |   new c(...args);
  15 |   c(...args);

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle ObjectMethod properties in ObjectExpression
  10 |   }
  11 |
> 12 |   const g = { ...a, b() {}, c: () => {} };
     |                     ^^^^^^
  13 |   const h = [...b];
  14 |   new c(...args);
  15 |   c(...args);

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle SpreadElement elements in ArrayExpression
  11 |
  12 |   const g = { ...a, b() {}, c: () => {} };
> 13 |   const h = [...b];
     |              ^^^^
  14 |   new c(...args);
  15 |   c(...args);
  16 |   g["e"] += 1;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle SpreadElement arguments in NewExpression
  12 |   const g = { ...a, b() {}, c: () => {} };
  13 |   const h = [...b];
> 14 |   new c(...args);
     |         ^^^^^^^
  15 |   c(...args);
  16 |   g["e"] += 1;
  17 |   const [y, ...yy] = useState(0);

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle SpreadElement arguments in CallExpression
  13 |   const h = [...b];
  14 |   new c(...args);
> 15 |   c(...args);
     |     ^^^^^^^
  16 |   g["e"] += 1;
  17 |   const [y, ...yy] = useState(0);
  18 |   const { z, aa = "aa", ...zz } = useCustom();

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle StringLiteral properties in MemberExpression
  14 |   new c(...args);
  15 |   c(...args);
> 16 |   g["e"] += 1;
     |     ^^^
  17 |   const [y, ...yy] = useState(0);
  18 |   const { z, aa = "aa", ...zz } = useCustom();
  19 |

[ReactForget] TodoError: (BuildHIR::lowerAssignment) Handle RestElement in ArrayPattern
  15 |   c(...args);
  16 |   g["e"] += 1;
> 17 |   const [y, ...yy] = useState(0);
     |             ^^^^^
  18 |   const { z, aa = "aa", ...zz } = useCustom();
  19 |
  20 |   <Button {...args}></Button>;

[ReactForget] TodoError: (BuildHIR::lowerAssignment) Handle AssignmentPattern assignments
  16 |   g["e"] += 1;
  17 |   const [y, ...yy] = useState(0);
> 18 |   const { z, aa = "aa", ...zz } = useCustom();
     |              ^^^^^^^^^
  19 |
  20 |   <Button {...args}></Button>;
  21 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: (BuildHIR::lowerAssignment) Handle RestElement properties in ObjectPattern
  16 |   g["e"] += 1;
  17 |   const [y, ...yy] = useState(0);
> 18 |   const { z, aa = "aa", ...zz } = useCustom();
     |                         ^^^^^
  19 |
  20 |   <Button {...args}></Button>;
  21 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle JSXSpreadAttribute attributes in JSXElement
  18 |   const { z, aa = "aa", ...zz } = useCustom();
  19 |
> 20 |   <Button {...args}></Button>;
     |           ^^^^^^^^^
  21 |   <Button xlink:href="localhost:3000"></Button>;
  22 |   <Button haha={1}></Button>;
  23 |   <Button>{/** empty */}</Button>;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle JSXNamespacedName attribute names in JSXElement
  19 |
  20 |   <Button {...args}></Button>;
> 21 |   <Button xlink:href="localhost:3000"></Button>;
     |           ^^^^^^^^^^
  22 |   <Button haha={1}></Button>;
  23 |   <Button>{/** empty */}</Button>;
  24 |   <DesignSystem.Button />;

[ReactForget] TodoError: (BuildHIR::lowerJsxElement) Handle JSXEmptyExpression expressions
  21 |   <Button xlink:href="localhost:3000"></Button>;
  22 |   <Button haha={1}></Button>;
> 23 |   <Button>{/** empty */}</Button>;
     |            ^^^^^^^^^^^^
  24 |   <DesignSystem.Button />;
  25 |
  26 |   const j = function bar([quz, qux], ...args) {};

[ReactForget] TodoError: (BuildHIR::lowerJsxElementName) Handle JSXMemberExpression tags
  22 |   <Button haha={1}></Button>;
  23 |   <Button>{/** empty */}</Button>;
> 24 |   <DesignSystem.Button />;
     |    ^^^^^^^^^^^^^^^^^^^
  25 |
  26 |   const j = function bar([quz, qux], ...args) {};
  27 |

[ReactForget] TodoError: (BuildHIR::lower) Handle ArrayPattern params
  24 |   <DesignSystem.Button />;
  25 |
> 26 |   const j = function bar([quz, qux], ...args) {};
     |                          ^^^^^^^^^^
  27 |
  28 |   for (; i < 3; i += 1) {
  29 |     x.push(i);

[ReactForget] TodoError: (BuildHIR::lower) Handle RestElement params
  24 |   <DesignSystem.Button />;
  25 |
> 26 |   const j = function bar([quz, qux], ...args) {};
     |                                      ^^^^^^^
  27 |
  28 |   for (; i < 3; i += 1) {
  29 |     x.push(i);

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  26 |   const j = function bar([quz, qux], ...args) {};
  27 |
> 28 |   for (; i < 3; i += 1) {
     |   ^
  29 |     x.push(i);
  30 |   }
  31 |   for (; i < 3; ) {}

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  29 |     x.push(i);
  30 |   }
> 31 |   for (; i < 3; ) {}
     |   ^^^^^^^^^^^^^^^^^^
  32 |   for (;;) {}
  33 | }
  34 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  29 |     x.push(i);
  30 |   }
> 31 |   for (; i < 3; ) {}
     |   ^^^^^^^^^^^^^^^^^^
  32 |   for (;;) {}
  33 | }
  34 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  30 |   }
  31 |   for (; i < 3; ) {}
> 32 |   for (;;) {}
     |   ^^^^^^^^^^^
  33 | }
  34 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  30 |   }
  31 |   for (; i < 3; ) {}
> 32 |   for (;;) {}
     |   ^^^^^^^^^^^
  33 | }
  34 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty test in ForStatement
  30 |   }
  31 |   for (; i < 3; ) {}
> 32 |   for (;;) {}
     |   ^^^^^^^^^^^
  33 | }
  34 |
```
          
      