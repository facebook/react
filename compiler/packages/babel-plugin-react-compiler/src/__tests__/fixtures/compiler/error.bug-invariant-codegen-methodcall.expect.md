
## Input

```javascript
const YearsAndMonthsSince = () => {
  const diff = foo();
  const months = Math.floor(diff.bar());
  return <>{months}</>;
};

```


## Error

```
Found 1 error:

Invariant: [Codegen] Internal error: MethodCall::property must be an unpromoted + unmemoized MemberExpression. Got a `Identifier`

error.bug-invariant-codegen-methodcall.ts:3:17
  1 | const YearsAndMonthsSince = () => {
  2 |   const diff = foo();
> 3 |   const months = Math.floor(diff.bar());
    |                  ^^^^^^^^^^ [Codegen] Internal error: MethodCall::property must be an unpromoted + unmemoized MemberExpression. Got a `Identifier`
  4 |   return <>{months}</>;
  5 | };
  6 |
```
          
      