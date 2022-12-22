
## Input

```javascript
function g(a) {
  a.b.c = a.b.c + 1;
  a.b.c *= 2;
}

```

## Code

```javascript
function g(a) {
  a.b.c = a.b.c + 1;
  a.b.c = a.b.c * 2;
}

```
      