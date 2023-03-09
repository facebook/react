
## Input

```javascript
function Foo(props) {
  return (
    <>
      Hello {props.greeting}{" "}
      <div>
        <>Text</>
      </div>
    </>
  );
}

```

## Code

```javascript
function Foo(props) {
  return (
    <>
      Hello {props.greeting}
      {<div>{<>Text</>}</div>}
    </>
  );
}

```
      