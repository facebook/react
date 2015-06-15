var test = require('tap').test
var fs = require('../graceful-fs.js')

test('graceful fs is monkeypatched fs', function (t) {
  t.equal(fs, require('fs'))
  t.end()
})

test('open an existing file works', function (t) {
  var fd = fs.openSync(__filename, 'r')
  fs.closeSync(fd)
  fs.open(__filename, 'r', function (er, fd) {
    if (er) throw er
    fs.close(fd, function (er) {
      if (er) throw er
      t.pass('works')
      t.end()
    })
  })
})

test('open a non-existing file throws', function (t) {
  var er
  try {
    var fd = fs.openSync('this file does not exist', 'r')
  } catch (x) {
    er = x
  }
  t.ok(er, 'should throw')
  t.notOk(fd, 'should not get an fd')
  t.equal(er.code, 'ENOENT')

  fs.open('neither does this file', 'r', function (er, fd) {
    t.ok(er, 'should throw')
    t.notOk(fd, 'should not get an fd')
    t.equal(er.code, 'ENOENT')
    t.end()
  })
})
