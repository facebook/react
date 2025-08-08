
## Input

```javascript
function Component() {
  const x = 0;
  x = 1;
}

```


## Error

```
Found 1 error:

Error: Expect `const` declaration not to be reassigned

`x` is declared as const.

error.invalid-reassign-const.ts:3:2
  1 | function Component() {
  2 |   const x = 0;
> 3 |   x = 1;
    |   ^ Expect `const` declaration not to be reassigned
  4 | }
  5 |
```
          
      