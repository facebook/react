
## Input

```javascript
function foo([a, b], {c, d, e = 'e'}, f = 'f', ...args) {
  let i = 0;
  var x = [];

  class Bar {
    #secretSauce = 42;
    constructor() {
      console.log(this.#secretSauce);
    }
  }

  const g = {b() {}, c: () => {}};
  const {z, aa = 'aa'} = useCustom();

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

  for (c of [1, 2]) {
  }
  for ([v] of [[1], [2]]) {
  }
  for ({v} of [{v: 1}, {v: 2}]) {
  }

  for (let x in {a: 1}) {
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
Found 10 errors:

Todo: (BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration

error.todo-kitchensink.ts:3:2
  1 | function foo([a, b], {c, d, e = 'e'}, f = 'f', ...args) {
  2 |   let i = 0;
> 3 |   var x = [];
    |   ^^^^^^^^^^^ (BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration
  4 |
  5 |   class Bar {
  6 |     #secretSauce = 42;

Error: Inline `class` declarations are not supported

Move class declarations outside of components/hooks.

error.todo-kitchensink.ts:5:2
   3 |   var x = [];
   4 |
>  5 |   class Bar {
     |   ^^^^^^^^^^^
>  6 |     #secretSauce = 42;
     | ^^^^^^^^^^^^^^^^^^^^^^
>  7 |     constructor() {
     | ^^^^^^^^^^^^^^^^^^^^^^
>  8 |       console.log(this.#secretSauce);
     | ^^^^^^^^^^^^^^^^^^^^^^
>  9 |     }
     | ^^^^^^^^^^^^^^^^^^^^^^
> 10 |   }
     | ^^^^ Inline `class` declarations are not supported
  11 |
  12 |   const g = {b() {}, c: () => {}};
  13 |   const {z, aa = 'aa'} = useCustom();

Todo: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement

error.todo-kitchensink.ts:20:2
  18 |   const j = function bar([quz, qux], ...args) {};
  19 |
> 20 |   for (; i < 3; i += 1) {
     |   ^^^^^^^^^^^^^^^^^^^^^^^
> 21 |     x.push(i);
     | ^^^^^^^^^^^^^^
> 22 |   }
     | ^^^^ (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  23 |   for (; i < 3; ) {
  24 |     break;
  25 |   }

Todo: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement

error.todo-kitchensink.ts:23:2
  21 |     x.push(i);
  22 |   }
> 23 |   for (; i < 3; ) {
     |   ^^^^^^^^^^^^^^^^^
> 24 |     break;
     | ^^^^^^^^^^
> 25 |   }
     | ^^^^ (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  26 |   for (;;) {
  27 |     break;
  28 |   }

Todo: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement

error.todo-kitchensink.ts:26:2
  24 |     break;
  25 |   }
> 26 |   for (;;) {
     |   ^^^^^^^^^^
> 27 |     break;
     | ^^^^^^^^^^
> 28 |   }
     | ^^^^ (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement
  29 |
  30 |   graphql`
  31 |     ${g}

Todo: (BuildHIR::lowerStatement) Handle empty test in ForStatement

error.todo-kitchensink.ts:26:2
  24 |     break;
  25 |   }
> 26 |   for (;;) {
     |   ^^^^^^^^^^
> 27 |     break;
     | ^^^^^^^^^^
> 28 |   }
     | ^^^^ (BuildHIR::lowerStatement) Handle empty test in ForStatement
  29 |
  30 |   graphql`
  31 |     ${g}

Todo: (BuildHIR::lowerExpression) Handle tagged template with interpolations

error.todo-kitchensink.ts:30:2
  28 |   }
  29 |
> 30 |   graphql`
     |   ^^^^^^^^
> 31 |     ${g}
     | ^^^^^^^^
> 32 |   `;
     | ^^^^ (BuildHIR::lowerExpression) Handle tagged template with interpolations
  33 |
  34 |   graphql`\\t\n`;
  35 |

Todo: (BuildHIR::lowerExpression) Handle tagged template where cooked value is different from raw value

error.todo-kitchensink.ts:34:2
  32 |   `;
  33 |
> 34 |   graphql`\\t\n`;
     |   ^^^^^^^^^^^^^^ (BuildHIR::lowerExpression) Handle tagged template where cooked value is different from raw value
  35 |
  36 |   for (c of [1, 2]) {
  37 |   }

Todo: (BuildHIR::node.lowerReorderableExpression) Expression type `MemberExpression` cannot be safely reordered

error.todo-kitchensink.ts:57:9
  55 |     case foo(): {
  56 |     }
> 57 |     case x.y: {
     |          ^^^ (BuildHIR::node.lowerReorderableExpression) Expression type `MemberExpression` cannot be safely reordered
  58 |     }
  59 |     default: {
  60 |     }

Todo: (BuildHIR::node.lowerReorderableExpression) Expression type `BinaryExpression` cannot be safely reordered

error.todo-kitchensink.ts:53:9
  51 |
  52 |   switch (i) {
> 53 |     case 1 + 1: {
     |          ^^^^^ (BuildHIR::node.lowerReorderableExpression) Expression type `BinaryExpression` cannot be safely reordered
  54 |     }
  55 |     case foo(): {
  56 |     }
```
          
      