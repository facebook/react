
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
  const str = "";
  let str$0 = str;
  if (cond) {
    const str_0 = "other test";
    log(str_0);
  } else {
    const str$1 = "fallthrough test";
    str$0 = str$1;
  }

  log(str$0);
}

```
      