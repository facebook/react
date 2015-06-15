if (!this.uuid) {
  // node.js
  uuid = require('../uuid');
}

//
// x-platform log/assert shims
//

function _log(msg, type) {
  type = type || 'log';

  if (typeof(document) != 'undefined') {
    document.write('<div class="' + type + '">' + msg.replace(/\n/g, '<br />') + '</div>');
  }
  if (typeof(console) != 'undefined') {
    var color = {
      log: '\033[39m',
      warn: '\033[33m',
      error: '\033[31m'
    };
    console[type](color[type] + msg + color.log);
  }
}

function log(msg) {_log(msg, 'log');}
function warn(msg) {_log(msg, 'warn');}
function error(msg) {_log(msg, 'error');}

function assert(res, msg) {
  if (!res) {
    error('FAIL: ' + msg);
  } else {
    log('Pass: ' + msg);
  }
}

//
// Unit tests
//

// Verify ordering of v1 ids created with explicit times
var TIME = 1321644961388; // 2011-11-18 11:36:01.388-08:00

function compare(name, ids) {
  ids = ids.map(function(id) {
    return id.split('-').reverse().join('-');
  }).sort();
  var sorted = ([].concat(ids)).sort();

  assert(sorted.toString() == ids.toString(), name + ' have expected order');
}

// Verify ordering of v1 ids created using default behavior
compare('uuids with current time', [
  uuid.v1(),
  uuid.v1(),
  uuid.v1(),
  uuid.v1(),
  uuid.v1()
]);

// Verify ordering of v1 ids created with explicit times
compare('uuids with time option', [
  uuid.v1({msecs: TIME - 10*3600*1000}),
  uuid.v1({msecs: TIME - 1}),
  uuid.v1({msecs: TIME}),
  uuid.v1({msecs: TIME + 1}),
  uuid.v1({msecs: TIME + 28*24*3600*1000})
]);

assert(
  uuid.v1({msecs: TIME}) != uuid.v1({msecs: TIME}),
  'IDs created at same msec are different'
);

// Verify throw if too many ids created
var thrown = false;
try {
  uuid.v1({msecs: TIME, nsecs: 10000});
} catch (e) {
  thrown = true;
}
assert(thrown, 'Exception thrown when > 10K ids created in 1 ms');

// Verify clock regression bumps clockseq
var uidt = uuid.v1({msecs: TIME});
var uidtb = uuid.v1({msecs: TIME - 1});
assert(
  parseInt(uidtb.split('-')[3], 16) - parseInt(uidt.split('-')[3], 16) === 1,
  'Clock regression by msec increments the clockseq'
);

// Verify clock regression bumps clockseq
var uidtn = uuid.v1({msecs: TIME, nsecs: 10});
var uidtnb = uuid.v1({msecs: TIME, nsecs: 9});
assert(
  parseInt(uidtnb.split('-')[3], 16) - parseInt(uidtn.split('-')[3], 16) === 1,
  'Clock regression by nsec increments the clockseq'
);

// Verify explicit options produce expected id
var id = uuid.v1({
  msecs: 1321651533573,
  nsecs: 5432,
  clockseq: 0x385c,
  node: [ 0x61, 0xcd, 0x3c, 0xbb, 0x32, 0x10 ]
});
assert(id == 'd9428888-122b-11e1-b85c-61cd3cbb3210', 'Explicit options produce expected id');

// Verify adjacent ids across a msec boundary are 1 time unit apart
var u0 = uuid.v1({msecs: TIME, nsecs: 9999});
var u1 = uuid.v1({msecs: TIME + 1, nsecs: 0});

var before = u0.split('-')[0], after = u1.split('-')[0];
var dt = parseInt(after, 16) - parseInt(before, 16);
assert(dt === 1, 'Ids spanning 1ms boundary are 100ns apart');

//
// Test parse/unparse
//

id = '00112233445566778899aabbccddeeff';
assert(uuid.unparse(uuid.parse(id.substr(0,10))) ==
  '00112233-4400-0000-0000-000000000000', 'Short parse');
assert(uuid.unparse(uuid.parse('(this is the uuid -> ' + id + id)) ==
  '00112233-4455-6677-8899-aabbccddeeff', 'Dirty parse');

//
// Perf tests
//

var generators = {
  v1: uuid.v1,
  v4: uuid.v4
};

var UUID_FORMAT = {
  v1: /[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  v4: /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
};

var N = 1e4;

// Get %'age an actual value differs from the ideal value
function divergence(actual, ideal) {
  return Math.round(100*100*(actual - ideal)/ideal)/100;
}

function rate(msg, t) {
  log(msg + ': ' + (N / (Date.now() - t) * 1e3 | 0) + ' uuids\/second');
}

for (var version in generators) {
  var counts = {}, max = 0;
  var generator = generators[version];
  var format = UUID_FORMAT[version];

  log('\nSanity check ' + N + ' ' + version + ' uuids');
  for (var i = 0, ok = 0; i < N; i++) {
    id = generator();
    if (!format.test(id)) {
      throw Error(id + ' is not a valid UUID string');
    }

    if (id != uuid.unparse(uuid.parse(id))) {
      assert(fail, id + ' is not a valid id');
    }

    // Count digits for our randomness check
    if (version == 'v4') {
      var digits = id.replace(/-/g, '').split('');
      for (var j = digits.length-1; j >= 0; j--) {
        var c = digits[j];
        max = Math.max(max, counts[c] = (counts[c] || 0) + 1);
      }
    }
  }

  // Check randomness for v4 UUIDs
  if (version == 'v4') {
    // Limit that we get worried about randomness. (Purely empirical choice, this!)
    var limit = 2*100*Math.sqrt(1/N);

    log('\nChecking v4 randomness.  Distribution of Hex Digits (% deviation from ideal)');

    for (var i = 0; i < 16; i++) {
      var c = i.toString(16);
      var bar = '', n = counts[c], p = Math.round(n/max*100|0);

      // 1-3,5-8, and D-F: 1:16 odds over 30 digits
      var ideal = N*30/16;
      if (i == 4) {
        // 4: 1:1 odds on 1 digit, plus 1:16 odds on 30 digits
        ideal = N*(1 + 30/16);
      } else if (i >= 8 && i <= 11) {
        // 8-B: 1:4 odds on 1 digit, plus 1:16 odds on 30 digits
        ideal = N*(1/4 + 30/16);
      } else {
        // Otherwise: 1:16 odds on 30 digits
        ideal = N*30/16;
      }
      var d = divergence(n, ideal);

      // Draw bar using UTF squares (just for grins)
      var s = n/max*50 | 0;
      while (s--) bar += '=';

      assert(Math.abs(d) < limit, c + ' |' + bar + '| ' + counts[c] + ' (' + d + '% < ' + limit + '%)');
    }
  }
}

// Perf tests
for (var version in generators) {
  log('\nPerformance testing ' + version + ' UUIDs');
  var generator = generators[version];
  var buf = new uuid.BufferClass(16);

  for (var i = 0, t = Date.now(); i < N; i++) generator();
  rate('uuid.' + version + '()', t);

  for (var i = 0, t = Date.now(); i < N; i++) generator('binary');
  rate('uuid.' + version + '(\'binary\')', t);

  for (var i = 0, t = Date.now(); i < N; i++) generator('binary', buf);
  rate('uuid.' + version + '(\'binary\', buffer)', t);
}
