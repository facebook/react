# generate-function

Module that helps you write generated functions in Node

```
npm install generate-function
```

[![build status](http://img.shields.io/travis/mafintosh/generate-function.svg?style=flat)](http://travis-ci.org/mafintosh/generate-function)

## Disclamer

Writing code that generates code is hard.
You should only use this if you really, really, really need this for performance reasons (like schema validators / parsers etc).

## Usage

``` js
var genfun = require('generate-function')

var addNumber = function(val) {
  var fn = genfun()
    ('function add(n) {')
      ('return n + %d', val) // supports format strings to insert values
    ('}')

  return fn.toFunction() // will compile the function
}

var add2 = addNumber(2)

console.log('1+2=', add2(1))
console.log(add2.toString()) // prints the generated function
```

If you need to close over variables in your generated function pass them to `toFunction(scope)`

``` js
var multiply = function(a, b) {
  return a * b
}

var addAndMultiplyNumber = function(val) {
  var fn = genfun()
    ('function(n) {')
      ('if (typeof n !== "number") {') // ending a line with { will indent the source
        ('throw new Error("argument should be a number")')
      ('}')
      ('var result = multiply(%d, n+%d)', val, val)
      ('return result')
    ('}')

  // use fn.toString() if you want to see the generated source

  return fn.toFunction({
    multiply: multiply
  })
}

var addAndMultiply2 = addAndMultiplyNumber(2)

console.log('(3 + 2) * 2 =', addAndMultiply2(3))
```

## Related

See [generate-object-property](https://github.com/mafintosh/generate-object-property) if you need to safely generate code that
can be used to reference an object property

## License

MIT