var test = require('tap').test
var minimatch = require('../')

test('extglob ending with statechar', function(t) {
  t.notOk(minimatch('ax', 'a?(b*)'))
  t.ok(minimatch('ax', '?(a*|b)'))
  t.end()
})
