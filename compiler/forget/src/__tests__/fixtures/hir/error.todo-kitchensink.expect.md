
## Input

```javascript
function foo([a, b], { c, d, e = "e" }, f = "f", ...args) {
  let i = 0;
  var x = [];

  class Bar {}

  with (true) {
  }

  for (; i < 3; i += 1) {
    x.push(i);
  }
  for (; i < 3; ) {}
  for (;;) {}
}

```


## Error

```
Forget Error: [TODO] Support non-identifier params: ArrayPattern on lines 1:1
function foo([a, b], {
  c,
  d,
  e = "e"
}, f = "f", ...args) {
  let i = 0;
  var x = [];
  class Bar {}
  with (true) {}
  for (; i < 3; i += 1) {
    x.push(i);
  }
  for (; i < 3;) {}
  for (;;) {}
}

Forget Error: [TODO] Support non-identifier params: ObjectPattern on lines 1:1
function foo([a, b], {
  c,
  d,
  e = "e"
}, f = "f", ...args) {
  let i = 0;
  var x = [];
  class Bar {}
  with (true) {}
  for (; i < 3; i += 1) {
    x.push(i);
  }
  for (; i < 3;) {}
  for (;;) {}
}

Forget Error: [TODO] Support non-identifier params: AssignmentPattern on lines 1:1
function foo([a, b], {
  c,
  d,
  e = "e"
}, f = "f", ...args) {
  let i = 0;
  var x = [];
  class Bar {}
  with (true) {}
  for (; i < 3; i += 1) {
    x.push(i);
  }
  for (; i < 3;) {}
  for (;;) {}
}

Forget Error: [TODO] Support non-identifier params: RestElement on lines 1:1
function foo([a, b], {
  c,
  d,
  e = "e"
}, f = "f", ...args) {
  let i = 0;
  var x = [];
  class Bar {}
  with (true) {}
  for (; i < 3; i += 1) {
    x.push(i);
  }
  for (; i < 3;) {}
  for (;;) {}
}

Forget Error: [TODO] `var` declarations are not supported, use let or const on lines 3:3
var x = [];

Forget Error: [TODO] Unhandled statement type: ClassDeclaration
class Bar {}

Forget Error: [TODO] Unhandled statement type: WithStatement
with (true) {}

Forget Error: [TODO] Support non-variable initialization in for
for (; i < 3; i += 1) {
  x.push(i);
}

Forget Error: [TODO] Support non-variable initialization in for
for (; i < 3;) {}

Forget Error: [TODO] Handle empty for updater
for (; i < 3;) {}

Forget Error: [TODO] Support non-variable initialization in for
for (;;) {}

Forget Error: [TODO] Handle empty for updater
for (;;) {}

Forget Error: [TODO] ForStatement without test
for (;;) {}
```
          
      