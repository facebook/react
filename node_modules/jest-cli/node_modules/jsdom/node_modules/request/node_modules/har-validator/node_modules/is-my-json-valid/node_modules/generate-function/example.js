var genfun = require('./')

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

console.log(addAndMultiply2.toString())
console.log('(3 + 2) * 2 =', addAndMultiply2(3))