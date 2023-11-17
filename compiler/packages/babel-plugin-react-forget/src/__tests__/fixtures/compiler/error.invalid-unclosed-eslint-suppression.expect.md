
## Input

```javascript
// Note: Everything below this is sketchy
/* eslint-disable react-hooks/rules-of-hooks */
function lowercasecomponent() {
  "use forget";
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
[ReactForget] InvalidReact: React Forget has bailed out of optimizing this component as one or more React eslint rules were disabled. React Forget only works when your components follow all the rules of React, disabling them may result in undefined behavior. eslint-disable react-hooks/rules-of-hooks (2:2)

[ReactForget] InvalidReact: React Forget has bailed out of optimizing this component as one or more React eslint rules were disabled. React Forget only works when your components follow all the rules of React, disabling them may result in undefined behavior. eslint-disable-next-line react-hooks/rules-of-hooks (25:25)
```
          
      