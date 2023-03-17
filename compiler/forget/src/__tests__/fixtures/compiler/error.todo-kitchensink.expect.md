
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
  14 |   const { z, aa = "aa" } = useCustom();
  15 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle SpreadElement arguments in NewExpression
  11 |
  12 |   const g = { b() {}, c: () => {} };
> 13 |   new c(...args);
     |         ^^^^^^^
  14 |   const { z, aa = "aa" } = useCustom();
  15 |
  16 |   <Button xlink:href="localhost:3000"></Button>;

[ReactForget] TodoError: (BuildHIR::lowerAssignment) Handle AssignmentPattern assignments
  12 |   const g = { b() {}, c: () => {} };
  13 |   new c(...args);
> 14 |   const { z, aa = "aa" } = useCustom();
     |              ^^^^^^^^^
  15 |
  16 |   <Button xlink:href="localhost:3000"></Button>;
  17 |   <Button haha={1}></Button>;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle JSXNamespacedName attribute names in JSXElement
  14 |   const { z, aa = "aa" } = useCustom();
  15 |
> 16 |   <Button xlink:href="localhost:3000"></Button>;
     |           ^^^^^^^^^^
  17 |   <Button haha={1}></Button>;
  18 |   <Button>{/** empty */}</Button>;
  19 |   <DesignSystem.Button />;

[ReactForget] TodoError: (BuildHIR::lowerJsxElement) Handle JSXEmptyExpression expressions
  16 |   <Button xlink:href="localhost:3000"></Button>;
  17 |   <Button haha={1}></Button>;
> 18 |   <Button>{/** empty */}</Button>;
     |            ^^^^^^^^^^^^
  19 |   <DesignSystem.Button />;
  20 |
  21 |   const j = function bar([quz, qux], ...args) {};

[ReactForget] TodoError: (BuildHIR::lower) Handle RestElement params
  19 |   <DesignSystem.Button />;
  20 |
> 21 |   const j = function bar([quz, qux], ...args) {};
     |                                      ^^^^^^^
  22 |
  23 |   for (; i < 3; i += 1) {
  24 |     x.push(i);

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  21 |   const j = function bar([quz, qux], ...args) {};
  22 |
> 23 |   for (; i < 3; i += 1) {
     |   ^
  24 |     x.push(i);
  25 |   }
  26 |   for (; i < 3; ) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  24 |     x.push(i);
  25 |   }
> 26 |   for (; i < 3; ) {
     |   ^
  27 |     break;
  28 |   }
  29 |   for (;;) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  24 |     x.push(i);
  25 |   }
> 26 |   for (; i < 3; ) {
     |   ^
  27 |     break;
  28 |   }
  29 |   for (;;) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  27 |     break;
  28 |   }
> 29 |   for (;;) {
     |   ^
  30 |     break;
  31 |   }
  32 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  27 |     break;
  28 |   }
> 29 |   for (;;) {
     |   ^
  30 |     break;
  31 |   }
  32 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty test in ForStatement
  27 |     break;
  28 |   }
> 29 |   for (;;) {
     |   ^
  30 |     break;
  31 |   }
  32 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle tagged template with interpolations
  31 |   }
  32 |
> 33 |   graphql`
     |   ^
  34 |     ${g}
  35 |   `;
  36 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle tagged template where cooked value is different from raw value
  35 |   `;
  36 |
> 37 |   graphql`\\t\n`;
     |   ^^^^^^^^^^^^^^
  38 |
  39 |   for (const c of [1, 2]) {
  40 |   }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ForOfStatement statements
  37 |   graphql`\\t\n`;
  38 |
> 39 |   for (const c of [1, 2]) {
     |   ^
  40 |   }
  41 |
  42 |   for (let x in { a: 1 }) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ForInStatement statements
  40 |   }
  41 |
> 42 |   for (let x in { a: 1 }) {
     |   ^
  43 |   }
  44 |
  45 |   let updateIdentifier = 0;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle prefix UpdateExpression
  44 |
  45 |   let updateIdentifier = 0;
> 46 |   --updateIdentifier;
     |   ^^^^^^^^^^^^^^^^^^
  47 |   ++updateIdentifier;
  48 |   updateIdentifier.y++;
  49 |   updateIdentifier.y--;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle prefix UpdateExpression
  45 |   let updateIdentifier = 0;
  46 |   --updateIdentifier;
> 47 |   ++updateIdentifier;
     |   ^^^^^^^^^^^^^^^^^^
  48 |   updateIdentifier.y++;
  49 |   updateIdentifier.y--;
  50 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle UpdateExpression with MemberExpression argument
  46 |   --updateIdentifier;
  47 |   ++updateIdentifier;
> 48 |   updateIdentifier.y++;
     |   ^^^^^^^^^^^^^^^^^^^^
  49 |   updateIdentifier.y--;
  50 |
  51 |   switch (i) {

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle UpdateExpression with MemberExpression argument
  47 |   ++updateIdentifier;
  48 |   updateIdentifier.y++;
> 49 |   updateIdentifier.y--;
     |   ^^^^^^^^^^^^^^^^^^^^
  50 |
  51 |   switch (i) {
  52 |     case 1 + 1: {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  54 |     case foo(): {
  55 |     }
> 56 |     case x.y: {
     |          ^^^
  57 |     }
  58 |     default: {
  59 |     }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  52 |     case 1 + 1: {
  53 |     }
> 54 |     case foo(): {
     |          ^^^^^
  55 |     }
  56 |     case x.y: {
  57 |     }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Switch case test values must be identifiers or primitives, compound values are not yet supported
  50 |
  51 |   switch (i) {
> 52 |     case 1 + 1: {
     |          ^^^^^
  53 |     }
  54 |     case foo(): {
  55 |     }

[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  61 |
  62 |   // Cannot assign to globals
> 63 |   someUnknownGlobal = true;
     |   ^^^^^^^^^^^^^^^^^
  64 |   moduleLocal = true;
  65 |
  66 |   function component(a) {

[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  62 |   // Cannot assign to globals
  63 |   someUnknownGlobal = true;
> 64 |   moduleLocal = true;
     |   ^^^^^^^^^^^
  65 |
  66 |   function component(a) {
  67 |     // Add support for function declarations once we support `var` hoisting.

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle FunctionDeclaration statements
  64 |   moduleLocal = true;
  65 |
> 66 |   function component(a) {
     |   ^
  67 |     // Add support for function declarations once we support `var` hoisting.
  68 |     function t() {}
  69 |     t();
```
          
      