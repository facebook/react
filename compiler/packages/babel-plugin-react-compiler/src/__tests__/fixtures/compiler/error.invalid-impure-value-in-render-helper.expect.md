
## Input

```javascript
// @validateNoImpureFunctionsInRender
function Component() {
  const now = () => Date.now();
  const render = () => {
    return <div>{now()}</div>;
  };
  return <div>{render()}</div>;
}

```


## Error

```
Found 2 errors:

Error: Cannot access impure value during render

Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-value-in-render-helper.ts:5:17
  3 |   const now = () => Date.now();
  4 |   const render = () => {
> 5 |     return <div>{now()}</div>;
    |                  ^^^^^ Cannot access impure value during render
  6 |   };
  7 |   return <div>{render()}</div>;
  8 | }

error.invalid-impure-value-in-render-helper.ts:3:20
  1 | // @validateNoImpureFunctionsInRender
  2 | function Component() {
> 3 |   const now = () => Date.now();
    |                     ^^^^^^^^^^ `Date.now` is an impure function.
  4 |   const render = () => {
  5 |     return <div>{now()}</div>;
  6 |   };

Error: Cannot access impure value during render

Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

error.invalid-impure-value-in-render-helper.ts:7:15
  5 |     return <div>{now()}</div>;
  6 |   };
> 7 |   return <div>{render()}</div>;
    |                ^^^^^^^^ Cannot access impure value during render
  8 | }
  9 |

error.invalid-impure-value-in-render-helper.ts:3:20
  1 | // @validateNoImpureFunctionsInRender
  2 | function Component() {
> 3 |   const now = () => Date.now();
    |                     ^^^^^^^^^^ `Date.now` is an impure function.
  4 |   const render = () => {
  5 |     return <div>{now()}</div>;
  6 |   };
```
          
      