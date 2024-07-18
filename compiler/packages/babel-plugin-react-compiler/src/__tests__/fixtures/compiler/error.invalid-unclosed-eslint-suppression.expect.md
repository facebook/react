
## Input

```javascript
// Note: Everything below this is sketchy
/* eslint-disable react-hooks/rules-of-hooks */
function lowercasecomponent() {
  'use forget';
  const x = [];
  return <div>{x}</div>;
}

function Haunted() {
  return <div>This entire file is haunted oOoOo</div>;
}

function CrimesAgainstReact() {
  let x = React.useMemo(async () => {
    await a;
  }, []);

  class MyAmazingInnerComponent {
    render() {
      return <div>Why would you do this</div>;
    }
  }

  // Note: This shouldn't reset the eslint suppression to just this line
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return <MyAmazingInnerComponent />;
}

```


## Error

```
  1 | // Note: Everything below this is sketchy
> 2 | /* eslint-disable react-hooks/rules-of-hooks */
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ InvalidReact: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled. React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. eslint-disable react-hooks/rules-of-hooks (2:2)

InvalidReact: React Compiler has skipped optimizing this component because one or more React ESLint rules were disabled. React Compiler only works when your components follow all the rules of React, disabling them may result in unexpected or incorrect behavior. eslint-disable-next-line react-hooks/rules-of-hooks (25:25)
  3 | function lowercasecomponent() {
  4 |   'use forget';
  5 |   const x = [];
```
          
      