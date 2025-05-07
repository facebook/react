
## Input

```javascript
// @panicThreshold(none)
'use no memo';

function Foo() {
  return <button onClick={() => alert('hello!')}>Click me!</button>;
}

```

## Code

```javascript
// @panicThreshold(none)
"use no memo";

function Foo() {
  return <button onClick={() => alert("hello!")}>Click me!</button>;
}
function _temp() {
  return alert("hello!");
}

```
      
### Eval output
(kind: exception) Fixture not implemented