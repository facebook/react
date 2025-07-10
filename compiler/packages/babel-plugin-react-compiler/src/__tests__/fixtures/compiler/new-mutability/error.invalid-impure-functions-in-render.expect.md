
## Input

```javascript
// @validateNoImpureFunctionsInRender @enableNewMutationAliasingModel

function Component() {
  const date = Date.now();
  const now = performance.now();
  const rand = Math.random();
  return <Foo date={date} now={now} rand={rand} />;
}

```


## Error

```
Found 3 errors:
Error: Calling an impure function can produce unstable results. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent)

`Date.now` is an impure function whose results may change on every call.

error.invalid-impure-functions-in-render.ts:4:15
  2 |
  3 | function Component() {
> 4 |   const date = Date.now();
    |                ^^^^^^^^^^ Calling an impure function can produce unstable results. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent)
  5 |   const now = performance.now();
  6 |   const rand = Math.random();
  7 |   return <Foo date={date} now={now} rand={rand} />;


Error: Calling an impure function can produce unstable results. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent)

`performance.now` is an impure function whose results may change on every call.

error.invalid-impure-functions-in-render.ts:5:14
  3 | function Component() {
  4 |   const date = Date.now();
> 5 |   const now = performance.now();
    |               ^^^^^^^^^^^^^^^^^ Calling an impure function can produce unstable results. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent)
  6 |   const rand = Math.random();
  7 |   return <Foo date={date} now={now} rand={rand} />;
  8 | }


Error: Calling an impure function can produce unstable results. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent)

`Math.random` is an impure function whose results may change on every call.

error.invalid-impure-functions-in-render.ts:6:15
  4 |   const date = Date.now();
  5 |   const now = performance.now();
> 6 |   const rand = Math.random();
    |                ^^^^^^^^^^^^^ Calling an impure function can produce unstable results. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent)
  7 |   return <Foo date={date} now={now} rand={rand} />;
  8 | }
  9 |


```
          
      