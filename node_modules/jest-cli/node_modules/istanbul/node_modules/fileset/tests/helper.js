
var EventEmitter = require('events').EventEmitter,
  assert = require('assert'),
  tests = {};

module.exports = test;
test.run = run;

// ## Test helpers

function test(msg, handler) {
  tests[msg] = handler;
}

function run() {
  var specs = Object.keys(tests),
    specsRemaining = specs.length;

  specs.forEach(function(spec) {
    var handler = tests[spec];

    // grab the set of asserts for this spec
    var shoulds = handler(),
      keys = Object.keys(shoulds),
      remaining = keys.length;

    keys.forEach(function(should) {
      var em = new EventEmitter(),
        to = setTimeout(function() {
          assert.fail('never ended');
        }, 5000);

      em
        .on('error', function assertFail(err) { assert.fail(err) })
        .on('end', function assertOk() {
          clearTimeout(to);
          shoulds[should].status = true;

          // till we get to 0
          if(!(--remaining)) {
            console.log([
              '',
              '» ' + spec,
              keys.map(function(k) { return '   » ' + k; }).join('\n'),
              '',
              '   Total: ' + keys.length,
              '   Failed: ' + keys.map(function(item) { return shoulds[should].status; }).filter(function(status) { return !status; }).length,
              ''
            ].join('\n'));

            if(!(--specsRemaining)) {
              console.log('All done');
            }

          }
        });

      shoulds[should](em);
    });
  });
}
