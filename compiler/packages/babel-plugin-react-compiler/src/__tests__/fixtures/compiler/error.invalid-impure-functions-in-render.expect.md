
## Input

```javascript
// @validateNoImpureFunctionsInRender

function Component() {
  const date = Date.now();
  const now = performance.now();
  const rand = Math.random();
  return <Foo date={date} now={now} rand={rand} />;
}

```


## Error

```
  2 |
  3 | function Component() {
> 4 |   const date = Date.now();
    |                ^^^^^^^^ InvalidReact: Calling an impure function can produce unstable results. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent). `Date.now` is an impure function whose results may change on every call (4:4)

InvalidReact: Calling an impure function can produce unstable results. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent). `performance.now` is an impure function whose results may change on every call (5:5)

InvalidReact: Calling an impure function can produce unstable results. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent). `Math.random` is an impure function whose results may change on every call (6:6)
  5 |   const now = performance.now();
  6 |   const rand = Math.random();
  7 |   return <Foo date={date} now={now} rand={rand} />;
```
          
      