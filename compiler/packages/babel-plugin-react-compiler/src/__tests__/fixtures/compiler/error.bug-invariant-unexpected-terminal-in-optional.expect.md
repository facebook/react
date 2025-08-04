
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

Invariant: Unexpected terminal in optional

error.bug-invariant-unexpected-terminal-in-optional.ts:3:16
  1 | const Foo = ({json}) => {
  2 |   try {
> 3 |     const foo = JSON.parse(json)?.foo;
    |                 ^^^^ Unexpected terminal in optional
  4 |     return <span>{foo}</span>;
  5 |   } catch {
  6 |     return null;
```
          
      