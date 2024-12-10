
## Input

```javascript
function Foo() {
  let i = 0;
  for (42; i < 1; i += 1) {}
  for (bar(); i < 1; i += 1) {}
  for (; i < 1; i += 1) {}
  for (i = 0; i < 1; i += 1) {}
  let j = 0;
  for (i = 0, j = 0; i < 1; i += 1) {}
}

function bar() {}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```

## Code

```javascript
function Foo() {
  let i = 0;
  for (42; i < 1; i = i + 1, i) {}
  for (bar(); i < 1; i = i + 1, i) {}
  for (undefined; i < 1; i = i + 1, i) {}
  for (i = 0; i < 1; i = i + 1, i) {}
  let j;
  for (((i = 0), (j = 0)), undefined; i < 1; i = i + 1, i) {}
}

function bar() {}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```
      
### Eval output
(kind: ok) 