
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
  1 | function foo([a, b], {c, d, e = 'e'}, f = 'f', ...args) {
  2 |   let i = 0;
> 3 |   var x = [];
    |   ^^^^^^^^^^^ Todo: (BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration (3:3)

Todo: (BuildHIR::lowerStatement) Handle ClassDeclaration statements (5:10)

Todo: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement (20:22)

Todo: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement (23:25)

Todo: (BuildHIR::lowerStatement) Handle non-variable initialization in ForStatement (26:28)

Todo: (BuildHIR::lowerStatement) Handle empty test in ForStatement (26:28)

Todo: (BuildHIR::lowerExpression) Handle tagged template with interpolations (30:32)

Todo: (BuildHIR::lowerExpression) Handle tagged template where cooked value is different from raw value (34:34)

Todo: (BuildHIR::lowerStatement) Handle Identifier inits in ForOfStatement (36:36)

Todo: (BuildHIR::lowerStatement) Handle ArrayPattern inits in ForOfStatement (38:38)

Todo: (BuildHIR::lowerStatement) Handle ObjectPattern inits in ForOfStatement (40:40)

Todo: (BuildHIR::node.lowerReorderableExpression) Expression type `MemberExpression` cannot be safely reordered (57:57)

Todo: (BuildHIR::node.lowerReorderableExpression) Expression type `BinaryExpression` cannot be safely reordered (53:53)
  4 |
  5 |   class Bar {
  6 |     #secretSauce = 42;
```
          
      