
## Input

```javascript
const Foo = ({json}) => {
  try {
    const foo = JSON.parse(json)?.foo;
    return <span>{foo}</span>;
  } catch {
    return null;
  }
};

```


## Error

```
Found 1 error:

Todo: Support value blocks (conditional, logical, optional chaining, etc) within a try/catch statement

error.todo-optional-chaining-within-try-catch.ts:3:16
  1 | const Foo = ({json}) => {
  2 |   try {
> 3 |     const foo = JSON.parse(json)?.foo;
    |                 ^^^^ Support value blocks (conditional, logical, optional chaining, etc) within a try/catch statement
  4 |     return <span>{foo}</span>;
  5 |   } catch {
  6 |     return null;
```
          
      