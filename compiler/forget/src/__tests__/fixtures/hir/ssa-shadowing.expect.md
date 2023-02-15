
## Input

```javascript
function log() {}

function Foo(cond) {
  let str = "";
  if (cond) {
    let str = "other test";
    log(str);
  } else {
    str = "fallthrough test";
  }
  log(str);
}

```

## Code

```javascript
function log() {}

function Foo(cond) {
  let str = "";
  if (cond) {
    const str_0 = "other test";
    log(str_0);
  } else {
    str = "fallthrough test";
  }

  log(str);
}

```
      