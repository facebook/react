
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

  <Button haha={1}></Button>;
  <Button>{/** empty */}</Button>;

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
  15 |   <Button haha={1}></Button>;

[ReactForget] TodoError: (BuildHIR::lower) Handle RestElement params
  16 |   <Button>{/** empty */}</Button>;
  17 |
> 18 |   const j = function bar([quz, qux], ...args) {};
     |                                      ^^^^^^^
  19 |
  20 |   for (; i < 3; i += 1) {
  21 |     x.push(i);

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  18 |   const j = function bar([quz, qux], ...args) {};
  19 |
> 20 |   for (; i < 3; i += 1) {
     |   ^
  21 |     x.push(i);
  22 |   }
  23 |   for (; i < 3; ) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  21 |     x.push(i);
  22 |   }
> 23 |   for (; i < 3; ) {
     |   ^
  24 |     break;
  25 |   }
  26 |   for (;;) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  21 |     x.push(i);
  22 |   }
> 23 |   for (; i < 3; ) {
     |   ^
  24 |     break;
  25 |   }
  26 |   for (;;) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  24 |     break;
  25 |   }
> 26 |   for (;;) {
     |   ^
  27 |     break;
  28 |   }
  29 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty update in ForStatement
  24 |     break;
  25 |   }
> 26 |   for (;;) {
     |   ^
  27 |     break;
  28 |   }
  29 |

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle empty test in ForStatement
  24 |     break;
  25 |   }
> 26 |   for (;;) {
     |   ^
  27 |     break;
  28 |   }
  29 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle tagged template with interpolations
  28 |   }
  29 |
> 30 |   graphql`
     |   ^
  31 |     ${g}
  32 |   `;
  33 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle tagged template where cooked value is different from raw value
  32 |   `;
  33 |
> 34 |   graphql`\\t\n`;
     |   ^^^^^^^^^^^^^^
  35 |
  36 |   for (const c of [1, 2]) {
  37 |   }

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ForOfStatement statements
  34 |   graphql`\\t\n`;
  35 |
> 36 |   for (const c of [1, 2]) {
     |   ^
  37 |   }
  38 |
  39 |   for (let x in { a: 1 }) {

[ReactForget] TodoError: (BuildHIR::lowerStatement) Handle ForInStatement statements
  37 |   }
  38 |
> 39 |   for (let x in { a: 1 }) {
     |   ^
  40 |   }
  41 |
  42 |   let updateIdentifier = 0;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle prefix UpdateExpression
  41 |
  42 |   let updateIdentifier = 0;
> 43 |   --updateIdentifier;
     |   ^^^^^^^^^^^^^^^^^^
  44 |   ++updateIdentifier;
  45 |   updateIdentifier.y++;
  46 |   updateIdentifier.y--;

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle prefix UpdateExpression
  42 |   let updateIdentifier = 0;
  43 |   --updateIdentifier;
> 44 |   ++updateIdentifier;
     |   ^^^^^^^^^^^^^^^^^^
  45 |   updateIdentifier.y++;
  46 |   updateIdentifier.y--;
  47 |

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle UpdateExpression with MemberExpression argument
  43 |   --updateIdentifier;
  44 |   ++updateIdentifier;
> 45 |   updateIdentifier.y++;
     |   ^^^^^^^^^^^^^^^^^^^^
  46 |   updateIdentifier.y--;
  47 |
  48 |   switch (i) {

[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle UpdateExpression with MemberExpression argument
  44 |   ++updateIdentifier;
  45 |   updateIdentifier.y++;
> 46 |   updateIdentifier.y--;
     |   ^^^^^^^^^^^^^^^^^^^^
  47 |
  48 |   switch (i) {
  49 |     case 1 + 1: {

[ReactForget] TodoError: (BuildHIR::node.lowerReorderableExpression) Expression type 'MemberExpression' cannot be safely reordered
  51 |     case foo(): {
  52 |     }
> 53 |     case x.y: {
     |          ^^^
  54 |     }
  55 |     default: {
  56 |     }

[ReactForget] TodoError: (BuildHIR::node.lowerReorderableExpression) Expression type 'CallExpression' cannot be safely reordered
  49 |     case 1 + 1: {
  50 |     }
> 51 |     case foo(): {
     |          ^^^^^
  52 |     }
  53 |     case x.y: {
  54 |     }

[ReactForget] TodoError: (BuildHIR::node.lowerReorderableExpression) Expression type 'BinaryExpression' cannot be safely reordered
  47 |
  48 |   switch (i) {
> 49 |     case 1 + 1: {
     |          ^^^^^
  50 |     }
  51 |     case foo(): {
  52 |     }

[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  58 |
  59 |   // Cannot assign to globals
> 60 |   someUnknownGlobal = true;
     |   ^^^^^^^^^^^^^^^^^
  61 |   moduleLocal = true;
  62 |
  63 |   function component(a) {

[ReactForget] InvalidInputError: (BuildHIR::lowerAssignment) Assigning to an identifier defined outside the function scope is not supported.
  59 |   // Cannot assign to globals
  60 |   someUnknownGlobal = true;
> 61 |   moduleLocal = true;
     |   ^^^^^^^^^^^
  62 |
  63 |   function component(a) {
  64 |     // Add support for function declarations once we support `var` hoisting.
```
          
      