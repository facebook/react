
## Input

```javascript
function Component(props) {
  return (
    <fbt desc="Title">
      <fbt:plural count={identity(props.count)} name="count" showCount="yes">
        vote
      </fbt:plural>{" "}
      for <fbt:param name="option">{props.option} </fbt:param>
    </fbt>
  );
}

```


## Error

```
   5 |         vote
   6 |       </fbt:plural>{" "}
>  7 |       for <fbt:param name="option">{props.option} </fbt:param>
     |           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ [ReactForget] Invariant: Expected fbt element to have 3 children (whitespace, content, whitespace) or 1 (content) (7:7)
   8 |     </fbt>
   9 |   );
  10 | }
```
          
      