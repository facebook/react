var test = require("tap").test
var fs = require("fs")

var readdir = fs.readdir
fs.readdir = function(path, cb) {
  process.nextTick(function() {
    cb(null, ["b", "z", "a"])
  })
}

var g = require("../")

test("readdir reorder", function (t) {
  g.readdir("whatevers", function (er, files) {
    if (er)
      throw er
    console.error(files)
    t.same(files, [ "a", "b", "z" ])
    t.end()
  })
})
