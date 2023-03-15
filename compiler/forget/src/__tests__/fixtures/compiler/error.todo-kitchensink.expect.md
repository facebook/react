
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

  const g = { b() {}, c: () => {} };
  new c(...args);
  c(...args);
  const { z, aa = "aa" } = useCustom();

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

  function component(a) {
    // Add support for function declarations once we support `var` hoisting.
    function t() {}
    t();
  }
}

let moduleLocal = false;

```


## Error

```
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

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle ObjectMethod properties in ObjectExpression
  10 |   }
  11 |
> 12 |   const g = { b() {}, c: () => {} };
     |               ^^^^^^
  13 |   new c(...args);
  14 |   c(...args);
  15 |   const { z, aa = "aa" } = useCustom();

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle SpreadElement arguments in NewExpression
  11 |
  12 |   const g = { b() {}, c: () => {} };
> 13 |   new c(...args);
     |         ^^^^^^^
  14 |   c(...args);
  15 |   const { z, aa = "aa" } = useCustom();
  16 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle SpreadElement arguments in CallExpression
  12 |   const g = { b() {}, c: () => {} };
  13 |   new c(...args);
> 14 |   c(...args);
     |     ^^^^^^^
  15 |   const { z, aa = "aa" } = useCustom();
  16 |
  17 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: (BuildHIR::lowerAssignment) Handle AssignmentPattern assignments
  13 |   new c(...args);
  14 |   c(...args);
> 15 |   const { z, aa = "aa" } = useCustom();
     |              ^^^^^^^^^
  16 |
  17 |   <Button xlink:href="localhost:3000"></Button>;
  18 |   <Button haha={1}></Button>;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle JSXNamespacedName attribute names in JSXElement
  15 |   const { z, aa = "aa" } = useCustom();
  16 |
> 17 |   <Button xlink:href="localhost:3000"></Button>;
     |           ^^^^^^^^^^
  18 |   <Button haha={1}></Button>;
  19 |   <Button>{/** empty */}</Button>;
  20 |   <DesignSystem.Button />;

[ReactForget] TodoError: (BuildHIR::lowerJsxElement) Handle JSXEmptyExpression expressions
  17 |   <Button xlink:href="localhost:3000"></Button>;
  18 |   <Button haha={1}></Button>;
> 19 |   <Button>{/** empty */}</Button>;
     |            ^^^^^^^^^^^^
  20 |   <DesignSystem.Button />;
  21 |
  22 |   const j = function bar([quz, qux], ...args) {};

[ReactForget] TodoError: (BuildHIR::lowerJsxElementName) Handle JSXMemberExpression tags
  18 |   <Button haha={1}></Button>;
  19 |   <Button>{/** empty */}</Button>;
> 20 |   <DesignSystem.Button />;
     |    ^^^^^^^^^^^^^^^^^^^
  21 |
  22 |   const j = function bar([quz, qux], ...args) {};
  23 |

[ReactForget] TodoError: (BuildHIR::lower) Handle RestElement params
  20 |   <DesignSystem.Button />;
  21 |
> 22 |   const j = function bar([quz, qux], ...args) {};
     |                                      ^^^^^^^
  23 |
  24 |   for (; i < 3; i += 1) {
  25 |     x.push(i);

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  22 |   const j = function bar([quz, qux], ...args) {};
  23 |
> 24 |   for (; i < 3; i += 1) {
     |   ^
  25 |     x.push(i);
  26 |   }
  27 |   for (; i < 3; ) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  25 |     x.push(i);
  26 |   }
> 27 |   for (; i < 3; ) {
     |   ^
  28 |     break;
  29 |   }
  30 |   for (;;) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  25 |     x.push(i);
  26 |   }
> 27 |   for (; i < 3; ) {
     |   ^
  28 |     break;
  29 |   }
  30 |   for (;;) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  28 |     break;
  29 |   }
> 30 |   for (;;) {
     |   ^
  31 |     break;
  32 |   }
  33 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  28 |     break;
  29 |   }
> 30 |   for (;;) {
     |   ^
  31 |     break;
  32 |   }
  33 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty test in ForStatement
  28 |     break;
  29 |   }
> 30 |   for (;;) {
     |   ^
  31 |     break;
  32 |   }
  33 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle tagged template with interpolations
  32 |   }
  33 |
> 34 |   graphql`
     |   ^
  35 |     ${g}
  36 |   `;
  37 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle tagged template where cooked value is different from raw value
  36 |   `;
  37 |
> 38 |   graphql`\\t\n`;
     |   ^^^^^^^^^^^^^^
  39 |
  40 |   for (const c of [1, 2]) {
  41 |   }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ForOfStatement statements
  38 |   graphql`\\t\n`;
  39 |
> 40 |   for (const c of [1, 2]) {
     |   ^
  41 |   }
  42 |
  43 |   for (let x in { a: 1 }) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ForInStatement statements
  41 |   }
  42 |
> 43 |   for (let x in { a: 1 }) {
     |   ^
  44 |   }
  45 |
  46 |   let updateIdentifier = 0;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle prefix UpdateExpression
  45 |
  46 |   let updateIdentifier = 0;
> 47 |   --updateIdentifier;
     |   ^^^^^^^^^^^^^^^^^^
  48 |   ++updateIdentifier;
  49 |   updateIdentifier.y++;
  50 |   updateIdentifier.y--;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle prefix UpdateExpression
  46 |   let updateIdentifier = 0;
  47 |   --updateIdentifier;
> 48 |   ++updateIdentifier;
     |   ^^^^^^^^^^^^^^^^^^
  49 |   updateIdentifier.y++;
  50 |   updateIdentifier.y--;
  51 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle UpdateExpression with MemberExpression argument
  47 |   --updateIdentifier;
  48 |   ++updateIdentifier;
> 49 |   updateIdentifier.y++;
     |   ^^^^^^^^^^^^^^^^^^^^
  50 |   updateIdentifier.y--;
  51 |
  52 |   switch (i) {

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle UpdateExpression with MemberExpression argument
  48 |   ++updateIdentifier;
  49 |   updateIdentifier.y++;
> 50 |   updateIdentifier.y--;
     |   ^^^^^^^^^^^^^^^^^^^^
  51 |
  52 |   switch (i) {
  53 |     case 1 + 1: {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  55 |     case foo(): {
  56 |     }
> 57 |     case x.y: {
     |          ^^^
  58 |     }
  59 |     default: {
  60 |     }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  53 |     case 1 + 1: {
  54 |     }
> 55 |     case foo(): {
     |          ^^^^^
  56 |     }
  57 |     case x.y: {
  58 |     }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  51 |
  52 |   switch (i) {
> 53 |     case 1 + 1: {
     |          ^^^^^
  54 |     }
  55 |     case foo(): {
  56 |     }

[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  62 |
  63 |   // Cannot assign to globals
> 64 |   someUnknownGlobal = true;
     |   ^^^^^^^^^^^^^^^^^
  65 |   moduleLocal = true;
  66 |
  67 |   function component(a) {

[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  63 |   // Cannot assign to globals
  64 |   someUnknownGlobal = true;
> 65 |   moduleLocal = true;
     |   ^^^^^^^^^^^
  66 |
  67 |   function component(a) {
  68 |     // Add support for function declarations once we support `var` hoisting.

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle FunctionDeclaration statements
  65 |   moduleLocal = true;
  66 |
> 67 |   function component(a) {
     |   ^
  68 |     // Add support for function declarations once we support `var` hoisting.
  69 |     function t() {}
  70 |     t();
```
          
      