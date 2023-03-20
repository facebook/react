
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
  13 |   const { z, aa = "aa" } = useCustom();
  14 |
  15 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: (BuildHIR::lowerAssignment) Handle AssignmentPattern assignments
  11 |
  12 |   const g = { b() {}, c: () => {} };
> 13 |   const { z, aa = "aa" } = useCustom();
     |              ^^^^^^^^^
  14 |
  15 |   <Button xlink:href="localhost:3000"></Button>;
  16 |   <Button haha={1}></Button>;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle JSXNamespacedName attribute names in JSXElement
  13 |   const { z, aa = "aa" } = useCustom();
  14 |
> 15 |   <Button xlink:href="localhost:3000"></Button>;
     |           ^^^^^^^^^^
  16 |   <Button haha={1}></Button>;
  17 |   <Button>{/** empty */}</Button>;
  18 |   <DesignSystem.Button />;

[ReactForget] TodoError: (BuildHIR::lowerJsxElement) Handle JSXEmptyExpression expressions
  15 |   <Button xlink:href="localhost:3000"></Button>;
  16 |   <Button haha={1}></Button>;
> 17 |   <Button>{/** empty */}</Button>;
     |            ^^^^^^^^^^^^
  18 |   <DesignSystem.Button />;
  19 |
  20 |   const j = function bar([quz, qux], ...args) {};

[ReactForget] TodoError: (BuildHIR::lower) Handle RestElement params
  18 |   <DesignSystem.Button />;
  19 |
> 20 |   const j = function bar([quz, qux], ...args) {};
     |                                      ^^^^^^^
  21 |
  22 |   for (; i < 3; i += 1) {
  23 |     x.push(i);

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  20 |   const j = function bar([quz, qux], ...args) {};
  21 |
> 22 |   for (; i < 3; i += 1) {
     |   ^
  23 |     x.push(i);
  24 |   }
  25 |   for (; i < 3; ) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  23 |     x.push(i);
  24 |   }
> 25 |   for (; i < 3; ) {
     |   ^
  26 |     break;
  27 |   }
  28 |   for (;;) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  23 |     x.push(i);
  24 |   }
> 25 |   for (; i < 3; ) {
     |   ^
  26 |     break;
  27 |   }
  28 |   for (;;) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  26 |     break;
  27 |   }
> 28 |   for (;;) {
     |   ^
  29 |     break;
  30 |   }
  31 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  26 |     break;
  27 |   }
> 28 |   for (;;) {
     |   ^
  29 |     break;
  30 |   }
  31 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty test in ForStatement
  26 |     break;
  27 |   }
> 28 |   for (;;) {
     |   ^
  29 |     break;
  30 |   }
  31 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle tagged template with interpolations
  30 |   }
  31 |
> 32 |   graphql`
     |   ^
  33 |     ${g}
  34 |   `;
  35 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle tagged template where cooked value is different from raw value
  34 |   `;
  35 |
> 36 |   graphql`\\t\n`;
     |   ^^^^^^^^^^^^^^
  37 |
  38 |   for (const c of [1, 2]) {
  39 |   }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ForOfStatement statements
  36 |   graphql`\\t\n`;
  37 |
> 38 |   for (const c of [1, 2]) {
     |   ^
  39 |   }
  40 |
  41 |   for (let x in { a: 1 }) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ForInStatement statements
  39 |   }
  40 |
> 41 |   for (let x in { a: 1 }) {
     |   ^
  42 |   }
  43 |
  44 |   let updateIdentifier = 0;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle prefix UpdateExpression
  43 |
  44 |   let updateIdentifier = 0;
> 45 |   --updateIdentifier;
     |   ^^^^^^^^^^^^^^^^^^
  46 |   ++updateIdentifier;
  47 |   updateIdentifier.y++;
  48 |   updateIdentifier.y--;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle prefix UpdateExpression
  44 |   let updateIdentifier = 0;
  45 |   --updateIdentifier;
> 46 |   ++updateIdentifier;
     |   ^^^^^^^^^^^^^^^^^^
  47 |   updateIdentifier.y++;
  48 |   updateIdentifier.y--;
  49 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle UpdateExpression with MemberExpression argument
  45 |   --updateIdentifier;
  46 |   ++updateIdentifier;
> 47 |   updateIdentifier.y++;
     |   ^^^^^^^^^^^^^^^^^^^^
  48 |   updateIdentifier.y--;
  49 |
  50 |   switch (i) {

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle UpdateExpression with MemberExpression argument
  46 |   ++updateIdentifier;
  47 |   updateIdentifier.y++;
> 48 |   updateIdentifier.y--;
     |   ^^^^^^^^^^^^^^^^^^^^
  49 |
  50 |   switch (i) {
  51 |     case 1 + 1: {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  53 |     case foo(): {
  54 |     }
> 55 |     case x.y: {
     |          ^^^
  56 |     }
  57 |     default: {
  58 |     }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  51 |     case 1 + 1: {
  52 |     }
> 53 |     case foo(): {
     |          ^^^^^
  54 |     }
  55 |     case x.y: {
  56 |     }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  49 |
  50 |   switch (i) {
> 51 |     case 1 + 1: {
     |          ^^^^^
  52 |     }
  53 |     case foo(): {
  54 |     }

[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  60 |
  61 |   // Cannot assign to globals
> 62 |   someUnknownGlobal = true;
     |   ^^^^^^^^^^^^^^^^^
  63 |   moduleLocal = true;
  64 |
  65 |   function component(a) {

[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  61 |   // Cannot assign to globals
  62 |   someUnknownGlobal = true;
> 63 |   moduleLocal = true;
     |   ^^^^^^^^^^^
  64 |
  65 |   function component(a) {
  66 |     // Add support for function declarations once we support `var` hoisting.

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle FunctionDeclaration statements
  63 |   moduleLocal = true;
  64 |
> 65 |   function component(a) {
     |   ^
  66 |     // Add support for function declarations once we support `var` hoisting.
  67 |     function t() {}
  68 |     t();
```
          
      