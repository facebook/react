
## Input

```javascript
function Component({items}) {
  const colgroup = useMemo(
    () => (
      <colgroup>
        {items.map(item => <col key={item.id} />)}
      </colgroup>
    ),
    [items],
  );
  return <table>{colgroup}<tbody /></table>;
}

```


## Error

```
Found 1 error:

Todo: [hoisting] EnterSSA: Expected identifier to be defined before being used

Identifier colgroup$4 is undefined.

error.todo-jsx-intrinsic-tag-matches-local-binding.ts:2:2
   1 | function Component({items}) {
>  2 |   const colgroup = useMemo(
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^
>  3 |     () => (
     | ^^^^^^^^^^^
>  4 |       <colgroup>
     | ^^^^^^^^^^^
>  5 |         {items.map(item => <col key={item.id} />)}
     | ^^^^^^^^^^^
>  6 |       </colgroup>
     | ^^^^^^^^^^^
>  7 |     ),
     | ^^^^^^^^^^^
>  8 |     [items],
     | ^^^^^^^^^^^
>  9 |   );
     | ^^^^^ [hoisting] EnterSSA: Expected identifier to be defined before being used
  10 |   return <table>{colgroup}<tbody /></table>;
  11 | }
  12 |
```
          
      