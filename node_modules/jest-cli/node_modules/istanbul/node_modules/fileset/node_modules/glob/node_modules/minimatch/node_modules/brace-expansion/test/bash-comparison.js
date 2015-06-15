var test = require('tape');
var expand = require('..');
var fs = require('fs');
var resfile = __dirname + '/bash-results.txt';
var cases = fs.readFileSync(resfile, 'utf8').split('><><><><');

// throw away the EOF marker
cases.pop()

test('matches bash expansions', function(t) {
  cases.forEach(function(testcase) {
    var set = testcase.split('\n');
    var pattern = set.shift();
    var actual = expand(pattern);

    // If it expands to the empty string, then it's actually
    // just nothing, but Bash is a singly typed language, so
    // "nothing" is the same as "".
    if (set.length === 1 && set[0] === '') {
      set = []
    } else {
      // otherwise, strip off the [] that were added so that
      // "" expansions would be preserved properly.
      set = set.map(function (s) {
        return s.replace(/^\[|\]$/g, '')
      })
    }

    t.same(actual, set, pattern);
  });
  t.end();
})
