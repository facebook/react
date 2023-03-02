
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
  for (; i < 3; ) {
    break;
  }
  for (;;) {
    break;
  }

  graphql`
    ${g}
  `;

  graphql`\\t\n`;

  for (const c of [1, 2]) {
  }

  for (let x in { a: 1 }) {
  }

  let updateIdentifier = 0;
  --updateIdentifier;
  ++updateIdentifier;
  updateIdentifier.y++;
  updateIdentifier.y--;

  switch (i) {
    case 1 + 1: {
    }
    case foo(): {
    }
    case x.y: {
    }
    default: {
    }
  }

  // Cannot assign to globals
  someUnknownGlobal = true;
  moduleLocal = true;
}

let moduleLocal = false;

```


## Error

```
[ReactForget] TodoError: (BuildHIR::lower) Handle ArrayPattern params
> 1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
    |              ^^^^^^
  2 |   let i = 0;
  3 |   var x = [];
  4 |

[ReactForget] TodoError: (BuildHIR::lowerAssignment) Handle AssignmentPattern assignments
> 1 | function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
    |                              ^^^^^^^
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
  16 |   const [y, ...yy] = useState(0);

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle SpreadElement arguments in NewExpression
  12 |   const g = { ...a, b() {}, c: () => {} };
  13 |   const h = [...b];
> 14 |   new c(...args);
     |         ^^^^^^^
  15 |   c(...args);
  16 |   const [y, ...yy] = useState(0);
  17 |   const { z, aa = "aa", ...zz } = useCustom();

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle SpreadElement arguments in CallExpression
  13 |   const h = [...b];
  14 |   new c(...args);
> 15 |   c(...args);
     |     ^^^^^^^
  16 |   const [y, ...yy] = useState(0);
  17 |   const { z, aa = "aa", ...zz } = useCustom();
  18 |

[ReactForget] TodoError: (BuildHIR::lowerAssignment) Handle RestElement in ArrayPattern
  14 |   new c(...args);
  15 |   c(...args);
> 16 |   const [y, ...yy] = useState(0);
     |             ^^^^^
  17 |   const { z, aa = "aa", ...zz } = useCustom();
  18 |
  19 |   <Button {...args}></Button>;

[ReactForget] TodoError: (BuildHIR::lowerAssignment) Handle AssignmentPattern assignments
  15 |   c(...args);
  16 |   const [y, ...yy] = useState(0);
> 17 |   const { z, aa = "aa", ...zz } = useCustom();
     |              ^^^^^^^^^
  18 |
  19 |   <Button {...args}></Button>;
  20 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: (BuildHIR::lowerAssignment) Handle RestElement properties in ObjectPattern
  15 |   c(...args);
  16 |   const [y, ...yy] = useState(0);
> 17 |   const { z, aa = "aa", ...zz } = useCustom();
     |                         ^^^^^
  18 |
  19 |   <Button {...args}></Button>;
  20 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle JSXNamespacedName attribute names in JSXElement
  18 |
  19 |   <Button {...args}></Button>;
> 20 |   <Button xlink:href="localhost:3000"></Button>;
     |           ^^^^^^^^^^
  21 |   <Button haha={1}></Button>;
  22 |   <Button>{/** empty */}</Button>;
  23 |   <DesignSystem.Button />;

[ReactForget] TodoError: (BuildHIR::lowerJsxElement) Handle JSXEmptyExpression expressions
  20 |   <Button xlink:href="localhost:3000"></Button>;
  21 |   <Button haha={1}></Button>;
> 22 |   <Button>{/** empty */}</Button>;
     |            ^^^^^^^^^^^^
  23 |   <DesignSystem.Button />;
  24 |
  25 |   const j = function bar([quz, qux], ...args) {};

[ReactForget] TodoError: (BuildHIR::lowerJsxElementName) Handle JSXMemberExpression tags
  21 |   <Button haha={1}></Button>;
  22 |   <Button>{/** empty */}</Button>;
> 23 |   <DesignSystem.Button />;
     |    ^^^^^^^^^^^^^^^^^^^
  24 |
  25 |   const j = function bar([quz, qux], ...args) {};
  26 |

[ReactForget] TodoError: (BuildHIR::lower) Handle ArrayPattern params
  23 |   <DesignSystem.Button />;
  24 |
> 25 |   const j = function bar([quz, qux], ...args) {};
     |                          ^^^^^^^^^^
  26 |
  27 |   for (; i < 3; i += 1) {
  28 |     x.push(i);

[ReactForget] TodoError: (BuildHIR::lower) Handle RestElement params
  23 |   <DesignSystem.Button />;
  24 |
> 25 |   const j = function bar([quz, qux], ...args) {};
     |                                      ^^^^^^^
  26 |
  27 |   for (; i < 3; i += 1) {
  28 |     x.push(i);

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  25 |   const j = function bar([quz, qux], ...args) {};
  26 |
> 27 |   for (; i < 3; i += 1) {
     |   ^
  28 |     x.push(i);
  29 |   }
  30 |   for (; i < 3; ) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  28 |     x.push(i);
  29 |   }
> 30 |   for (; i < 3; ) {
     |   ^
  31 |     break;
  32 |   }
  33 |   for (;;) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  28 |     x.push(i);
  29 |   }
> 30 |   for (; i < 3; ) {
     |   ^
  31 |     break;
  32 |   }
  33 |   for (;;) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  31 |     break;
  32 |   }
> 33 |   for (;;) {
     |   ^
  34 |     break;
  35 |   }
  36 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  31 |     break;
  32 |   }
> 33 |   for (;;) {
     |   ^
  34 |     break;
  35 |   }
  36 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty test in ForStatement
  31 |     break;
  32 |   }
> 33 |   for (;;) {
     |   ^
  34 |     break;
  35 |   }
  36 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle tagged template with interpolations
  35 |   }
  36 |
> 37 |   graphql`
     |   ^
  38 |     ${g}
  39 |   `;
  40 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle tagged template where cooked value is different from raw value
  39 |   `;
  40 |
> 41 |   graphql`\\t\n`;
     |   ^^^^^^^^^^^^^^
  42 |
  43 |   for (const c of [1, 2]) {
  44 |   }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ForOfStatement statements
  41 |   graphql`\\t\n`;
  42 |
> 43 |   for (const c of [1, 2]) {
     |   ^
  44 |   }
  45 |
  46 |   for (let x in { a: 1 }) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ForInStatement statements
  44 |   }
  45 |
> 46 |   for (let x in { a: 1 }) {
     |   ^
  47 |   }
  48 |
  49 |   let updateIdentifier = 0;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle prefix UpdateExpression
  48 |
  49 |   let updateIdentifier = 0;
> 50 |   --updateIdentifier;
     |   ^^^^^^^^^^^^^^^^^^
  51 |   ++updateIdentifier;
  52 |   updateIdentifier.y++;
  53 |   updateIdentifier.y--;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle prefix UpdateExpression
  49 |   let updateIdentifier = 0;
  50 |   --updateIdentifier;
> 51 |   ++updateIdentifier;
     |   ^^^^^^^^^^^^^^^^^^
  52 |   updateIdentifier.y++;
  53 |   updateIdentifier.y--;
  54 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle UpdateExpression with MemberExpression argument
  50 |   --updateIdentifier;
  51 |   ++updateIdentifier;
> 52 |   updateIdentifier.y++;
     |   ^^^^^^^^^^^^^^^^^^^^
  53 |   updateIdentifier.y--;
  54 |
  55 |   switch (i) {

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle UpdateExpression with MemberExpression argument
  51 |   ++updateIdentifier;
  52 |   updateIdentifier.y++;
> 53 |   updateIdentifier.y--;
     |   ^^^^^^^^^^^^^^^^^^^^
  54 |
  55 |   switch (i) {
  56 |     case 1 + 1: {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  58 |     case foo(): {
  59 |     }
> 60 |     case x.y: {
     |          ^^^
  61 |     }
  62 |     default: {
  63 |     }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  56 |     case 1 + 1: {
  57 |     }
> 58 |     case foo(): {
     |          ^^^^^
  59 |     }
  60 |     case x.y: {
  61 |     }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  54 |
  55 |   switch (i) {
> 56 |     case 1 + 1: {
     |          ^^^^^
  57 |     }
  58 |     case foo(): {
  59 |     }

[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  65 |
  66 |   // Cannot assign to globals
> 67 |   someUnknownGlobal = true;
     |   ^^^^^^^^^^^^^^^^^
  68 |   moduleLocal = true;
  69 | }
  70 |

[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  66 |   // Cannot assign to globals
  67 |   someUnknownGlobal = true;
> 68 |   moduleLocal = true;
     |   ^^^^^^^^^^^
  69 | }
  70 |
  71 | let moduleLocal = false;
```
          
      